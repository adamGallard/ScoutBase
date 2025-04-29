// src/pages/parent/YouthAttendancePage.jsx

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
	fetchYouthByParentId,
	fetchLatestAttendanceForYouthList
} from '@/helpers/attendanceHelper';
import { logAuditEvent } from '@/helpers/auditHelper';
import SignInForm from '@/components/SignInForm';
import {
	PageWrapper,
	PageTitle,
	Main,
	Content,
	LogoWrapper,
	PrimaryButton
} from '@/components/common/SharedStyles';
import { sections } from '@/components/common/Lookups.js';
import { supabase } from '@/lib/supabaseClient';
import { useIsMobile } from '@/hooks/useIsMobile'

const codeToSectionLabel = code =>
	sections.find(s => s.code === code)?.label ?? code;

export default function YouthAttendancePage() {
	const navigate = useNavigate();
	const { state, search } = useLocation();
	const parent = state?.parent;
	const groupId = state?.groupId;
	const isMobile = useIsMobile();

	// pull the ?group=slug so we can bounce back to login if needed
	const query = new URLSearchParams(search);
	const groupSlug = query.get('group');

	// attendance “steps”
	const [step, setStep] = useState('list'); // or 'form'
	const [youthList, setYouthList] = useState([]);
	const [latestStatusMap, setLatestStatusMap] = useState({});
	const [sectionFilter, setSectionFilter] = useState('');
	const [selectedMember, setSelectedMember] = useState(null);
	const [loading, setLoading] = useState(false);

	// If no parent or groupId, redirect to login
	useEffect(() => {
		if (!parent || !groupId) {
			navigate(`/sign-in?group=${groupSlug}`, { replace: true });
		}
	}, [parent, groupId, groupSlug, navigate]);

	// Load youth & statuses once at mount
	useEffect(() => {
		if (!parent || !groupId) return;
		(async () => {
			setLoading(true);
			const { youthList: yl } =
				await fetchYouthByParentId(parent.id);
			const statusMap =
				await fetchLatestAttendanceForYouthList(yl, groupId);
			setYouthList(yl);
			setLatestStatusMap(statusMap);
			setLoading(false);
		})();
	}, [parent, groupId]);

	// Handle sign-in/out action
	const handleSign = async (memberId, data) => {
		// 1) Write to attendance table
		const now = new Date();
		const timestamp = now.toISOString();
		const event_date = timestamp.split('T')[0];
		const { error: insertError } = await supabase
			.from('attendance')
			.insert([{
				youth_id: memberId,
				group_id: groupId,
				action: data.action,        // e.g. 'signed in' / 'signed out'
				comment: data.comment || '', // if your SignInForm collects a comment
				timestamp,
				event_date,
				signed_by: parent.id,
			}]);

		if (insertError) {
			console.error('Failed to save attendance:', insertError);
			alert('Error saving attendance. Please try again.');
			return;
		}

		// 2) Log audit event
		await logAuditEvent({
			userId: parent.id,
			groupId,
			role: 'parent',
			action: data.action,
		});

		// 3) Go back to list and refresh statuses
		setStep('list');
		setSelectedMember(null);
		const statusMap = await fetchLatestAttendanceForYouthList(youthList, groupId);
		setLatestStatusMap(statusMap);
	};

	// Filtered youth by section
	const filteredYouth = youthList.filter(
		y => !sectionFilter || y.section === sectionFilter
	);

	return (
		<PageWrapper style={{ padding: '1rem', paddingBottom: '56px' }}>
			<PageTitle style={{ marginBottom: '1rem' }}>
				{parent?.name}
			</PageTitle>

			{/* Instruction to Select a Child */}
			{step === 'list' && (
				<p style={{ fontSize: '1rem', color: '#555', marginBottom: '1rem' }}>
					Please select your child from the list below to sign them in or out.
				</p>
			)}

			{/* Youth List */}
			{step === 'list' && (
				<>
					<div style={{
						margin: '1rem auto', display: 'flex', gap: '0.5rem', width: '90%',
						maxWidth: '500px',
					}}>
						<label style={{ flex: 1 }}>
							Filter Section:
							<select
								value={sectionFilter}
								onChange={e => setSectionFilter(e.target.value)}
								style={{

									padding: '0.75rem',
									fontSize: '1rem',
									borderRadius: 6,
									border: '1px solid #ccc',
									width: '100%',
								}}
							>
								<option value="">All</option>
								{sections.map(s => (
									<option key={s.code} value={s.code}>
										{s.label}
									</option>
								))}
							</select>
						</label>
					</div>

					{loading ? (
						<p>Loading youth…</p>
					) : (
						filteredYouth.map(y => {
							const latest = latestStatusMap[y.id];
							return (

								<div
									key={y.id}
									style={{
										width: '90%',
										maxWidth: '500px',
										background: '#fff',
										border: '1px solid #ccc',
										borderRadius: '8px',
										padding: '1rem',
										margin: '0.5rem auto',
										boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
									}}
								>
									<button
										onClick={() => {
											setSelectedMember(y)
											setStep('form');
										}}
										style={{
											width: '100%',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											background: 'none',
											border: 'none',
											padding: 0,
											textAlign: 'left',
											cursor: 'pointer',
											fontSize: isMobile ? '1rem' : '0.95rem',
										}}
									>
										<div>
											<div><strong>{y.name}</strong></div>
											<div style={{ fontSize: '0.875rem', color: '#6b7280', }}>{codeToSectionLabel(y.section)}</div>
										</div>
										<div
											style={{
												fontSize: '0.75rem',
												color: latest?.action === 'signed in' ? '#10b981' : '#ef4444',
												fontWeight: 'bold',
												textAlign: 'right',
											}}
										>
											{latest ? (
												<>
													{latest.action} at<br />
													{new Date(latest.timestamp).toLocaleString('en-AU', {
														weekday: 'short',
														month: 'short',
														day: 'numeric',
														hour: '2-digit',
														minute: '2-digit',
													})}
												</>
											) : (
												'Not signed in'
											)}
										</div>
									</button>
								</div>
							);
						})
					)}

					<PrimaryButton
     isMobile={isMobile}
					     type="button"
					      onClick={() => {
						        // clear any in-memory state if needed…
						        // then navigate back to the group login
							        navigate(`/sign-in?group=${groupSlug}`);
						      }}
    >
					      Logout
					    </PrimaryButton>
				</>
			)}

			{/* Attendance Form */}
			{step === 'form' && selectedMember && (
				<SignInForm
					member={selectedMember}
					parentName={parent.name}
					onSign={handleSign}
					onCancel={() => {
						// go back to the list view
						setStep('list');
						setSelectedMember(null);
					}}
					latestStatus={latestStatusMap[selectedMember.id]}
				/>
			)}
		</PageWrapper>
	);
}

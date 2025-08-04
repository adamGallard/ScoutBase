// src/pages/parent/YouthAttendancePage.jsx

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
	fetchYouthByParentId,
	fetchLatestAttendanceForYouthList,
	fetchLatestHelperAttendance
} from '@/helpers/attendanceHelper';
import { logAuditEvent } from '@/helpers/auditHelper';
import SignInForm from '@/components/SignInForm';
import {
	PageWrapperParent,
	PageTitle,
	Main,
	Content,
	LogoWrapper,
	PrimaryButton
} from '@/components/common/SharedStyles';
import { sections } from '@/components/common/Lookups.js';
import { supabase } from '@/lib/supabaseClient';
import { useIsMobile } from '@/hooks/useIsMobile'
import { getISODateInTZ } from '@/utils/dateUtils'

const codeToSectionLabel = code =>
	sections.find(s => s.code === code)?.label ?? code;

function toProperCase(str) {
	if (!str) return '';
	return str
		.replace(/_/g, ' ')                     // Replace underscores with spaces
		.replace(/\b\w/g, l => l.toUpperCase()); // Capitalise first letter of each word
}
export default function YouthAttendancePage() {
	const navigate = useNavigate();
	const { state, search } = useLocation();
	const parent = state?.parent;
	const groupId = state?.groupId;
	const isMobile = useIsMobile();
	const [helperRoles, setHelperRoles] = useState([]);
	const [helperStatusMap, setHelperStatusMap] = useState({});


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
	const [adultRoles, setAdultRoles] = useState([]);
	const [rolesLoading, setRolesLoading] = useState(true);
	const roleObj = adultRoles.find(r => r.code === parent.role_code);

	useEffect(() => {
		async function loadRoles() {
			setRolesLoading(true);
			const { data, error } = await supabase
				.from('adult_roles')
				.select('code, title, role_group, section, abbreviation');
			if (!error && data) setAdultRoles(data);
			setRolesLoading(false);
		}
		loadRoles();
	}, []);

	const nonParentRoleCodes = adultRoles
		.filter(r => r.role_group !== 'parent')
		.map(r => r.code);

	const codeToAdultRoleTitle = (code) =>
		adultRoles.find(r => r.code === code)?.title ?? code;
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

			// Fetch youth
			const { youthList: yl } = await fetchYouthByParentId(parent.id);
			const statusMap = await fetchLatestAttendanceForYouthList(yl, groupId);
			setYouthList(yl);
			setLatestStatusMap(statusMap);

			// Determine which roles are non-parent
			const nonParentRoleCodes = adultRoles
				.filter(r => r.role_group !== 'parent')
				.map(r => r.code);

			// Prepare helper roles
			let roles = [];
			if (parent.role_code && nonParentRoleCodes.includes(parent.role_code)) {
				roles = [{
					id: parent.id,
					parentId: parent.id,
					type: 'helper',
					name: parent.name,
					roleLabel: codeToAdultRoleTitle(parent.role_code),
					roleGroup: roleObj.role_group,
				}];
			}
			setHelperRoles(roles);

			// Fetch latest helper attendance
			const helperMap = await fetchLatestHelperAttendance(parent.id, groupId);
			setHelperStatusMap(helperMap);

			setLoading(false);
		})();
	}, [parent, groupId, adultRoles]);


	// Handle sign-in/out action
	const handleSign = async (memberId, data) => {


		if (selectedMember?.type === 'helper') {
			const event_date = getISODateInTZ('Australia/Brisbane');
			const timestamp = new Date().toISOString();

			const existing = helperStatusMap[selectedMember.roleLabel];
			const isSignedIn = existing?.action === 'signed in';

			const action = isSignedIn ? 'signed out' : 'signed in';

			const { error } = await supabase
				.from('helper_attendance')
				.insert([{
					parent_id: parent.id,
					group_id: groupId,
					action: data.action,        // e.g. 'signed in' / 'signed out'
					comment: data.comment || '', // if your SignInForm collects a comment
					timestamp,
					event_date,
					signed_by: parent.id,
				}]);

			if (error) {
				console.error('Failed to save helper attendance:', error);
				alert('Error saving helper attendance. Please try again.');
				return;
			}

			await logAuditEvent({
				userId: parent.id,
				groupId,
				role: selectedMember.roleLabel.toLowerCase(),
				action,
			});

			setStep('list');
			setSelectedMember(null);
			const helperMap = await fetchLatestHelperAttendance(parent.id, groupId);
			setHelperStatusMap(helperMap);
			return;
		}

		const timestamp = new Date().toISOString();            // keep full UTC stamp
		const event_date = getISODateInTZ('Australia/Brisbane'); // "2025-05-18"
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

		// Log audit event
		await logAuditEvent({
			userId: parent.id,
			groupId,
			role: 'parent',
			action: data.action,
		});

		// Go back to list and refresh statuses
		setStep('list');
		setSelectedMember(null);
		const statusMap = await fetchLatestAttendanceForYouthList(youthList, groupId);
		setLatestStatusMap(statusMap);
	};

	// Filtered youth by section
	const filteredYouth = youthList.filter(
		y => !sectionFilter || y.section === sectionFilter
	);

	const compareByName = (a, b) =>
		a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

	const primaryYouth = filteredYouth.filter(y => y.is_primary).sort(compareByName);
	const otherYouth = filteredYouth.filter(y => !y.is_primary).sort(compareByName);


	function renderMemberGroup({ label, members, getStatus, getStatusColor, getSubtitle }) {
		if (members.length === 0) return null;
		return (
			<>
				<h3 style={{
					margin: '1rem 0 0.25rem 1rem', fontWeight: 600,
					color: '#0F5BA4', fontSize: '1.05rem'
				}}>
					{label}
				</h3>
				{members.map(m => {
					const latest = getStatus(m);
					const statusColor = getStatusColor(latest);
					const statusLabel = latest
						? getSubtitle ? getSubtitle(m, latest) : (latest.action || '')
						: 'Not signed in';

					return (
						<div
							key={m.id}
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
									setSelectedMember(m);
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
									<strong>{m.name}</strong>
									{m.section && (
										<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
											{codeToSectionLabel(m.section)}
										</div>
									)}
									{m.roleLabel && (
										<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
											{m.roleLabel}
										
										</div>
									)}
								</div>
								<div style={{
									fontSize: '0.75rem',
									color: statusColor,
									fontWeight: 'bold',
									textAlign: 'right',
								}}>
									{latest ? (
										<>
											{statusLabel}<br />
											{new Date(latest.timestamp || latest.created_at).toLocaleString('en-AU', {
												weekday: 'short',
												month: 'short',
												day: 'numeric',
												hour: '2-digit',
												minute: '2-digit',
											})}
										</>
									) : 'Not signed in'}
								</div>
							</button>
						</div>
					);
				})}
			</>
		);
	}

	return (
		<PageWrapperParent style={{ padding: '0rem', paddingBottom: '56px' }}>
			<PageTitle style={{ marginBottom: '1rem' }}>
				{parent?.name}
			</PageTitle>

			{/* Instruction to Select a Child */}
			{step === 'list' && (
				<p style={{ fontSize: '1rem', color: '#555', marginBottom: '1rem' }}>
					Please select your child or helper role below to sign them in or out.
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
							<>
								{renderMemberGroup({
									label: toProperCase(helperRoles[0]?.roleGroup) || "Helper",
									members: helperRoles,
									getStatus: h => helperStatusMap[h.parentId],
									getStatusColor: latest => latest?.action === 'signed in' ? '#10b981' : '#ef4444'
								})}
								{renderMemberGroup({
									label: "Primary Children",
									members: primaryYouth,
									getStatus: y => latestStatusMap[y.id],
									getStatusColor: latest => latest?.action === 'signed in' ? '#10b981' : '#ef4444'
								}) }
								{renderMemberGroup({
									label: "Other Children",
									members: otherYouth,
									getStatus: y => latestStatusMap[y.id],
									getStatusColor: latest => latest?.action === 'signed in' ? '#10b981' : '#ef4444'
								}) }

						</>
					)}

					<PrimaryButton
						isMobile={isMobile}
						type="button"
						onClick={() => {
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
						setStep('list');
						setSelectedMember(null);
					}}
					latestStatus={
						selectedMember.type === 'helper'
							? helperStatusMap[selectedMember.parentId]
							: latestStatusMap[selectedMember.id]
					}
				/>
			)}
		</PageWrapperParent>
	);
}

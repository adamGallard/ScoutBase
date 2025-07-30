import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
	PageWrapper,
	PageTitle,
	PrimaryButton, AdminTable
} from '@/components/common/SharedStyles';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/common/Header'; // Adjust path as needed
export default function FamilySignupPage() {
	const RELATIONSHIP_OPTIONS = [
		{ value: 'Mother', label: 'Mother' },
		{ value: 'Father', label: 'Father' },
		{ value: 'Guardian', label: 'Guardian' },
		{ value: 'Other', label: 'Other' }
	];

	const params = new URLSearchParams(useLocation().search);
	const groupIdParam = params.get('group_id'); // UUID (preferred)
	const groupSlugParam = params.get('group'); 
	const [resolvedGroupId, setResolvedGroupId] = useState('');
	const [groupName, setGroupName] = useState('');
	const [loadingGroup, setLoadingGroup] = useState(true);

	useEffect(() => {
		async function fetchGroup() {
			setLoadingGroup(true);
			let data, error;
			if (groupIdParam && /^[0-9a-fA-F-]{36}$/.test(groupIdParam)) {
				// Use group_id as UUID
				({ data, error } = await supabase
					.from('groups')
					.select('id, name')
					.eq('id', groupIdParam)
					.single());
			} else if (groupSlugParam) {
				// Use group as slug
				({ data, error } = await supabase
					.from('groups')
					.select('id, name')
					.eq('slug', groupSlugParam)
					.single());
			}
			if (data) {
				setResolvedGroupId(data.id);
				setGroupName(data.name);
			} else {
				setResolvedGroupId('');
				setGroupName('');
			}
			setLoadingGroup(false);
		}
		fetchGroup();
	}, [groupIdParam, groupSlugParam]);

	const [parents, setParents] = useState([
		{ name: '', email: '', phone: '', skills: '', interests: '' }
	]);
	const [youths, setYouths] = useState([
		{ name: '', dob: '', gender: '', section: '' }
	]);
	// relationships[parentIdx][youthIdx] = { relationship, is_primary }
	const [relationships, setRelationships] = useState([
		[{ relationship: '', is_primary: false }]
	]);
	const [status, setStatus] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const addParent = () => {
		setParents(ps => [...ps, { name: '', email: '', phone: '', skills: '', interests: '' }]);
		setRelationships(r => [...r, youths.map(() => ({ relationship: '', is_primary: false }))]);
	};
	const removeParent = idx => {
		setParents(ps => ps.filter((_, i) => i !== idx));
		setRelationships(r => r.filter((_, i) => i !== idx));
	};
	const addYouth = () => {
		setYouths(ys => [...ys, { name: '', dob: '',gender: '', section: '' }]);
		setRelationships(r =>
			r.map(relArr => [...relArr, { relationship: '', is_primary: false }])
		);
	};
	const removeYouth = idx => {
		setYouths(ys => ys.filter((_, i) => i !== idx));
		setRelationships(r =>
			r.map(relArr => relArr.filter((_, i) => i !== idx))
		);
	};

	const setParentField = (idx, field, value) =>
		setParents(ps =>
			ps.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
		);
	const setYouthField = (idx, field, value) =>
		setYouths(ys =>
			ys.map((y, i) => (i === idx ? { ...y, [field]: value } : y))
		);
	const setRelField = (pIdx, yIdx, field, value) =>
		setRelationships(r =>
			r.map((relArr, pi) =>
				pi === pIdx
					? relArr.map((rel, yi) =>
						yi === yIdx ? { ...rel, [field]: value } : rel
					)
					: relArr
			)
		);

	const handleSubmit = async e => {
		e.preventDefault();
		setSubmitting(true);
		setStatus('');
		console.log("Submitting pending_family:", { group_id: resolvedGroupId });
		try {
			const { data: fam, error: famErr } = await supabase
				.from('pending_family')
				.insert({ group_id: resolvedGroupId })
				.select()
				.single();
			if (famErr) throw new Error(famErr.message);

			const { data: insertedParents, error: pErr } = await supabase
				.from('pending_parent')
				.insert(parents.map(p => ({ ...p, family_id: fam.id })))
				.select();
			if (pErr) throw new Error(pErr.message);

			const { data: insertedYouths, error: yErr } = await supabase
				.from('pending_youth')
				.insert(
					youths.map(y => ({
						...y,
						section: y.section ? y.section.toLowerCase() : '', // 👈 enforce lowercase
						family_id: fam.id
					}))
				)
				.select();
			if (yErr) throw new Error(yErr.message);

			const relRows = [];
			relationships.forEach((relArr, pIdx) => {
				relArr.forEach((rel, yIdx) => {
					let relationship = rel.relationship;
					if (relationship === 'Other') relationship = rel.other_label?.trim() || 'Other';
					if (relationship && relationship.trim() !== '') {
						relRows.push({
							family_id: fam.id,
							parent_id: insertedParents[pIdx].id,
							youth_id: insertedYouths[yIdx].id,
							relationship,
							is_primary: rel.relationship === 'Mother' || rel.relationship === 'Father' ? true : !!rel.is_primary
						});
					}
				});
			});
			if (relRows.length)
				await supabase.from('pending_parent_youth').insert(relRows);

			setStatus('Submitted! Thank you for registering. A leader will confirm your details soon.');
			setParents([{ name: '', email: '', phone: '', skills: '', interests: '' }]);
			setYouths([{ name: '', dob: '', gender: '', section: '' }]);
			setRelationships([[{ relationship: '', is_primary: false }]]);
		} catch (err) {
			setStatus('There was an error submitting: ' + err.message);
		}
		setSubmitting(false);
	};



	if (!resolvedGroupId || !groupName) {
		return (
			<PageWrapper>
				<Header />	
				<div style={{ textAlign: 'center', margin: '2rem 0' }}>
					<div style={{ fontSize: 18, fontWeight: 600, color: '#b91c1c' }}>Invalid or missing group</div>
					<p>Please contact your leader for the correct signup link.</p>
				</div>
			</PageWrapper>
		);
	}

	return (
	<>
		
		<PageWrapper style={{ paddingBottom: 40 }}>

<Header />		    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '18px 0 6px 0' }}>


					<PageTitle>Family Registration for {groupName}</PageTitle>      </div>
			<form
				onSubmit={handleSubmit}
				style={{
					maxWidth: 460,
					margin: '0 auto',
					background: '#fff',
					borderRadius: 12,
					boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
					padding: 18,
				}}
			>
				{/* PARENTS */}
				<div style={{ marginBottom: 20 }}>
					<b style={{ fontSize: 17, marginBottom: 6, display: 'block' }}>
						Parent/Guardian Details
					</b>
					{parents.map((parent, pIdx) => (
						<div
							key={pIdx}
							style={{
								margin: '14px 0',
								background: '#f9fafb',
								border: '1px solid #e5e7eb',
								borderRadius: 8,
								padding: 12,
								position: 'relative'
							}}
						>
							{parents.length > 1 && (
								<button
									type="button"
									onClick={() => removeParent(pIdx)}
									aria-label="Remove parent"
									style={{
										position: 'absolute',
										right: 10,
										top: 10,
										fontSize: 13,
										background: '#fee2e2',
										border: 'none',
										borderRadius: 4,
										color: '#991b1b',
										padding: '2px 8px',
										cursor: 'pointer'
									}}
								>
									Remove
								</button>
							)}
							<input
								style={inputStyle}
								required
								placeholder="Full Name"
								value={parent.name}
								onChange={e => setParentField(pIdx, 'name', e.target.value)}
								autoComplete="name"
							/>
							<input
								style={inputStyle}
								required
								type="email"
								placeholder="Email"
								value={parent.email}
								onChange={e => setParentField(pIdx, 'email', e.target.value)}
								autoComplete="email"
							/>
							<input
								style={inputStyle}
								required
								placeholder="Phone"
								value={parent.phone}
								onChange={e => setParentField(pIdx, 'phone', e.target.value)}
								autoComplete="tel"
							/>
							<input
								style={inputStyle}
								placeholder="Skills (optional)"
								value={parent.skills}
								onChange={e => setParentField(pIdx, 'skills', e.target.value)}
							/>
							<input
								style={inputStyle}
								placeholder="Interests/Hobbies (optional)"
								value={parent.interests}
								onChange={e => setParentField(pIdx, 'interests', e.target.value)}
							/>
							{/* Relationships to each youth */}
							{youths.length > 0 && (
								<div style={{ marginTop: 12 }}>
									<b style={{ fontSize: 15 }}>Relationship to each youth:</b>
									{youths.map((youth, yIdx) => {
										const rel = relationships[pIdx]?.[yIdx] || {};
										const isPrimary = rel.relationship === 'Mother' || rel.relationship === 'Father'
											? true
											: !!rel.is_primary;
										return (
											<div
												key={yIdx}
												style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}
											>
												<label style={{ minWidth: 70 }}>{youth.name || `Youth ${yIdx + 1}`}</label>
												<select
													style={{ ...inputStyle, width: 140, minWidth: 140, maxWidth: 170 }}
													value={rel.relationship || ''}
													onChange={e => {
														const value = e.target.value;
														setRelField(pIdx, yIdx, 'relationship', value);
														if (value === 'Mother' || value === 'Father') {
															setRelField(pIdx, yIdx, 'is_primary', true);
															setRelField(pIdx, yIdx, 'other_label', '');
														} else if (value !== 'Other') {
															setRelField(pIdx, yIdx, 'is_primary', false);
															setRelField(pIdx, yIdx, 'other_label', '');
														}
													}}
												>
													<option value="">Relationship...</option>
													{RELATIONSHIP_OPTIONS.map(opt => (
														<option key={opt.value} value={opt.value}>{opt.label}</option>
													))}
												</select>
												{/* Show textbox if "Other" */}
												{rel.relationship === 'Other' && (
													<input
														style={{ ...inputStyle, width: 120 }}
														placeholder="Please specify"
														value={rel.other_label || ''}
														onChange={e => setRelField(pIdx, yIdx, 'other_label', e.target.value)}
													/>
												)}
												<label style={{ fontSize: 13, marginLeft: 3 }}>
													<input
														type="checkbox"
														checked={isPrimary}
														disabled={rel.relationship === 'Mother' || rel.relationship === 'Father'}
														onChange={e => setRelField(pIdx, yIdx, 'is_primary', e.target.checked)}
														style={{ marginRight: 2 }}
													/>
													Primary
												</label>
											</div>
										);
									})}
								</div>
							)}
						</div>
					))}
					<PrimaryButton
						type="button"
						onClick={addParent}
						style={{
							width: '100%',
							background: '#f1f5f9',
							color: '#174f84',
							fontWeight: 'bold',
							marginTop: 0,
							marginBottom: 0,
						}}
					>
						Add another parent/guardian
					</PrimaryButton>
				</div>

				{/* YOUTHS */}
				<div style={{ marginBottom: 20 }}>
					<b style={{ fontSize: 17, marginBottom: 6, display: 'block' }}>
						Youth Details
					</b>
					{youths.map((youth, idx) => (
						<div
							key={idx}
							style={{
								margin: '14px 0',
								background: '#f9fafb',
								border: '1px solid #e5e7eb',
								borderRadius: 8,
								padding: 12,
								position: 'relative'
							}}
						>
							{youths.length > 1 && (
								<button
									type="button"
									onClick={() => removeYouth(idx)}
									aria-label="Remove youth"
									style={{
										position: 'absolute',
										right: 10,
										top: 10,
										fontSize: 13,
										background: '#fee2e2',
										border: 'none',
										borderRadius: 4,
										color: '#991b1b',
										padding: '2px 8px',
										cursor: 'pointer'
									}}
								>
									Remove
								</button>
							)}
							<input
								style={inputStyle}
								required
								placeholder="Full Name"
								value={youth.name}
								onChange={e => setYouthField(idx, 'name', e.target.value)}
								autoComplete="name"
							/>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
								<label
									htmlFor={`dob-${idx}`}
									style={{ fontSize: 15, fontWeight: 500, minWidth: 95 }}
								>
									Date of Birth
								</label>
								<input
									id={`dob-${idx}`}
									style={{ ...inputStyle, flex: 1, minWidth: 0 }}
									required
									type="date"
									value={youth.dob}
									onChange={e => setYouthField(idx, 'dob', e.target.value)}
									autoComplete="bday"
								/>
							</div>
							<select
								style={inputStyle}
								required
								value={youth.gender}
								onChange={e => setYouthField(idx, 'gender', e.target.value)}
							>
								<option value="">Gender...</option>
								<option value="male">Male</option>
								<option value="female">Female</option>
								<option value="non-binary">Non-binary</option>
								<option value="prefer not to say">Prefer not to say</option>
							</select>
							<select
								style={inputStyle}
								required
								value={youth.section}
								onChange={e => setYouthField(idx, 'section', e.target.value)}
							>
								<option value="">Section...</option>
								<option value="Joeys">Joeys</option>
								<option value="Cubs">Cubs</option>
								<option value="Scouts">Scouts</option>
								<option value="Venturers">Venturers</option>
							</select>
						</div>
					))}
					<PrimaryButton
						type="button"
						onClick={addYouth}
						style={{
							width: '100%',
							background: '#f1f5f9',
							color: '#174f84',
							fontWeight: 'bold',
							marginTop: 0,
							marginBottom: 0,
						}}
					>
						Add another youth
					</PrimaryButton>
				</div>
				<PrimaryButton
					type="submit"
					style={{ width: '100%', marginTop: 20, marginBottom: 6 }}
					disabled={submitting}
				>
					{submitting ? 'Submitting...' : 'Submit'}
				</PrimaryButton>
				{status && <div style={{
					color: status.startsWith('Submitted') ? 'green' : '#b91c1c',
					fontWeight: 'bold',
					fontSize: 16,
					marginTop: 8
				}}>
					{status}
				</div>}
			</form>
			</PageWrapper>
		</>
	);
}

const inputStyle = {
	width: '100%',
	padding: '10px 8px',
	margin: '5px 0 0 0',
	border: '1px solid #cbd5e1',
	borderRadius: 6,
	fontSize: 16
};

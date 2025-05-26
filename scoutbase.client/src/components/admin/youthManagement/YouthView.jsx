import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Pencil, Trash, Plus, Check, X, BookUser, Users, Link, Award } from 'lucide-react';
import TransitionModal from './TransitionModal';
import { formatDate } from '@/utils/dateUtils';
import { getTerrainSyncPreview, syncYouthFromTerrain } from '@/helpers/terrainSyncHelper';
import TerrainSyncModal from './TerrainSyncModal';
import BadgeHistoryModal from './BadgeHistoryModal';
import {
	PageWrapper,
	Main,
	Content,
	LogoWrapper,
	PrimaryButton,
	PageTitle, AdminTable
} from '@/components/common/SharedStyles';
import UnitSelectModal from './UnitSelectModal';
import YouthDetailsModal from './YouthDetailsModal';
import ImportYouthModal from './ImportYouthModal';
import { handleYouthImportLogic } from '@/helpers/supabaseHelpers'
import { logAuditEvent } from '@/helpers/auditHelper';
import { sections, stages } from '@/components/common/Lookups.js';

// Helpers to map code → label
const codeToSectionLabel = code =>
	sections.find(s => s.code === code)?.label ?? code;
const codeToStageLabel = code =>
	stages.find(s => s.code === code)?.label ?? code;
const sectionLabelToCode = val => {
	if (!val) return '';
	// try matching code first
	let s = sections.find(s => s.code === val);
	if (s) return s.code;
	// then try matching label (case‐insensitive)
	s = sections.find(s => s.label.toLowerCase() === val.toLowerCase());
	if (s) return s.code;
	// fallback: return the raw value
	return val;
};

export default function YouthView({ groupId, userInfo }) {

	const [addError, setAddError] = useState('');
	const [youthList, setYouthList] = useState([]);
	const [youthForm, setYouthForm] = useState({ name: '', dob: '', membership_stage: '' });
	const [editingYouthId, setEditingYouthId] = useState(null);
	const [filter, setFilter] = useState('');
	const [sectionFilter, setSectionFilter] = useState('');
	const [selectedYouth, setSelectedYouth] = useState(null);
	const [justAddedYouth, setJustAddedYouth] = useState(null);
	const [stageFilter, setStageFilter] = useState('');
	const [preview, setPreview] = useState(null); // { toAdd: [], toUpdate: [] }
	const [unitOptions, setUnitOptions] = useState([]);
	const [showUnitModal, setShowUnitModal] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 12;
	const [selectedYouthDetails, setSelectedYouthDetails] = useState(null);
	const [showImportModal, setShowImportModal] = useState(false);
	const [badgeModalYouth, setBadgeModalYouth] = useState(null);
	const handleYouthImport = async (data, filename) => {
		await handleYouthImportLogic(data, groupId, filename); // this is the real function logic
	};

	const handleTerrainSync = async () => {
		const token = localStorage.getItem('scoutbase-terrain-idtoken');
		if (!token) return alert('Please log in.');

		try {
			const cached = localStorage.getItem('scoutbase-terrain-units');
			const parsedUnits = cached ? JSON.parse(cached) : [];

			if (!Array.isArray(parsedUnits) || parsedUnits.length === 0) {
				throw new Error('No units available.');
			}

			// Optional: infer section to suggest relevant units
			const inferredSection = sectionFilter || 'Cubs';
			const autoSelected = parsedUnits.filter(u =>
				u.section?.toLowerCase().includes(inferredSection.toLowerCase())
			);

			setUnitOptions(parsedUnits); // ✅ This is where the modal reads from
			setShowUnitModal(true);
		} catch (err) {
			console.error('Failed to load Terrain units:', err);
			alert('Unable to fetch your units from Terrain.');
		}
	};


	const handleUnitsConfirmed = async (unitIds) => {
		setShowUnitModal(false);

		const token = localStorage.getItem('scoutbase-terrain-idtoken');
		const selectedUnits = unitOptions.filter(u => unitIds.includes(u.unitId));

		try {
			const preview = await getTerrainSyncPreview(token, groupId, selectedUnits);
			setPreview(preview);
		} catch (err) {
			console.error('Failed to preview sync:', err);
			alert('Unable to prepare sync preview.');
		}
	};

	const confirmSync = async () => {
		if (!preview) return;
		const result = await syncYouthFromTerrain(groupId, preview.toAdd, preview.toUpdate);
		alert(`Sync complete: ${result.added} added, ${result.updated} updated.`);
		setPreview(null);
		fetchYouth();
	};

	const cancelSync = () => {
		setPreview(null);
	};

	const fetchYouth = useCallback(async () => {
		let query = supabase
			.from('youth')
			.select('id, name, dob, section,linking_section, membership_stage')
			.eq('group_id', groupId)
			.order('name');

		console.log(userInfo?.role);
		//  Filter by section if the user is a Section Leader
		if (userInfo?.role === 'Section Leader' && userInfo?.section) {
			query = query.or(`section.eq.${userInfo.section},linking_section.eq.${userInfo.section}`);
		}


		const { data } = await query;
		setYouthList(data || []);
	}, [groupId, userInfo]);

	useEffect(() => {
		if (groupId) fetchYouth();
	}, [groupId, fetchYouth]);

	useEffect(() => {
		setCurrentPage(1);
	}, [filter, sectionFilter, stageFilter]);

	const addYouth = async () => {
		if (!youthForm.name || !youthForm.dob) {
			setAddError('Name and date of birth are required.');
			return;
		}

		const { data, error } = await supabase
			.from('youth')
			.insert([{ ...youthForm, group_id: groupId }])
			.select()
			.single();
		if (error) {
			console.error('Supabase error:', error);
			if (error.code === '23505') {
				// Postgres unique violation
				setAddError('This youth is already added.');
			} else {
				setAddError(error.message || 'Failed to add youth.');
			}
			return;
		}

		if (!error && data) {
			await logAuditEvent({
				userId: userInfo.id,
				groupId: userInfo.group_id,
				role: userInfo.role,
				action: 'Add',
				targetType: 'Youth',
				targetId: data.id,
				metadata: `Added youth: ${data.name} (${data.section})`
			});
			setAddError('');
		}
		if (data) {
			setYouthForm({ name: '', dob: '', membership_stage: '' });
			setSelectedYouth(data); // 🔄 replaces justAddedYouth
		}
	};

	const updateYouth = async (youthId) => {
		const { error } = await supabase
			.from('youth')
			.update(youthForm)
			.eq('id', youthId);

		if (!error) {
			await logAuditEvent({
				userId: userInfo.id,
				groupId: userInfo.group_id,
				role: userInfo.role,
				action: 'Edit',
				targetType: 'Youth',
				targetId: youthId,
				metadata: `Updated youth: ${youthForm.name} (${youthForm.membership_stage || 'N/A'})`
			});
			setEditingYouthId(null);
			setYouthForm({ name: '', dob: '', section: '', membership_stage: '' });
			fetchYouth();
		} else {
			console.error('Update youth failed:', error.message);
		}
	};

	const deleteYouth = async (id) => {
		if (confirm('Are you sure you want to delete this youth?')) {
			// 🧠 Fetch name for better metadata
			const { data: oldYouth } = await supabase
				.from('youth')
				.select('name')
				.eq('id', id)
				.single();

			const { error } = await supabase.from('youth').delete().eq('id', id);

			if (!error) {
				await logAuditEvent({
					userId: userInfo.id,
					groupId: userInfo.group_id,
					role: userInfo.role,
					action: 'Delete',
					targetType: 'Youth',
					targetId: id,
					metadata: `Deleted youth: ${oldYouth?.name || id}`
				});

				fetchYouth();
			} else {
				console.error('Delete youth failed:', error.message);
			}
		}
	};

	const filteredList = youthList
		.filter(y => {
			// normalize both stored fields and the selected filter
			const secCode = sectionLabelToCode(y.section);
			const linkCode = sectionLabelToCode(y.linking_section);
			const filterCode = sectionLabelToCode(sectionFilter);

			let matchesSection;
			if (userInfo?.role === 'Section Leader') {
				const leaderCode = (userInfo.section);
				matchesSection = !leaderCode
					|| secCode === leaderCode
					|| linkCode === leaderCode;
			} else {
				matchesSection = !filterCode
					|| secCode === filterCode
					|| linkCode === filterCode;
			}
			// Name search
			const matchesSearch = !filter
				|| y.name.toLowerCase().includes(filter);
			// Stage filter (you could do a similar helper if needed)
			const matchesStage = !stageFilter
				? y.membership_stage !== 'retired'
				: y.membership_stage === stageFilter;
			return matchesSection && matchesSearch && matchesStage;
		})
		.sort((a, b) => a.name.localeCompare(b.name));

	const paginatedList = filteredList.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const canSync = localStorage.getItem('scoutbase-terrain-units-available') === 'true';

	return (
		<div className="content-box">
			<div style={{
				display: 'flex',
				alignItems: 'center',
				gap: '5rem',
				marginBottom: '1rem',
				flexWrap: 'wrap'
			}}>
				<PageTitle>
					<Users size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />Youth Management
				</PageTitle>



				<PrimaryButton
					disabled={!canSync}
					onClick={handleTerrainSync}
					title={!canSync ? "Sync unavailable – no Terrain units" : "Sync Youth from Terrain"}
				>
					Sync Youth from Terrain
				</PrimaryButton>
				<PrimaryButton onClick={() => setShowImportModal(true)}>Import Youth</PrimaryButton>
				{showImportModal && (
					<ImportYouthModal
						onClose={() => setShowImportModal(false)}
						onImport={(data) => handleYouthImport(data)}
					/>
				)}
			</div>

			<div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
				<input
					type="text"
					placeholder="Search"
					value={filter}
					onChange={(e) => setFilter(e.target.value.toLowerCase())}
					style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px' }}
				/>

				{userInfo?.role !== 'Section Leader' && (
					<select
						value={sectionFilter}
						onChange={(e) => setSectionFilter(e.target.value)}
						style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px' }}
					>
						<option value="">All Sections</option>
						{sections
							.slice()
							.sort((a, b) => a.order - b.order)
							.map(({ code, label }) => (
								<option key={code} value={code}>
									{label}
								</option>
							))
						}
					</select>
				)}

				<select
					value={stageFilter}
					onChange={(e) => setStageFilter(e.target.value)}
					style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px' }}
				>
					<option value="">All Stages</option>
					{stages
						.slice()
						.sort((a, b) => a.order - b.order)
						.map(({ code, label }) => (
							<option key={code} value={code}>
								{label}
							</option>
						))
					}
				</select>
				<button
					onClick={() => {
						setFilter('');
						setSectionFilter('');
						setStageFilter('');
					}}
					style={{
						padding: '0.5rem 1rem',
						backgroundColor: '#e5e7eb',
						border: '1px solid #ccc',
						borderRadius: '6px',
						fontWeight: 'bold',
						cursor: 'pointer',
						marginLeft: 'auto'
					}}
				>
					Clear Filters
				</button>
			</div>

			<AdminTable>
				<thead>
					<tr>
						<th>Name</th>
						<th>DOB</th>
						<th>Section</th>
						<th>Stage</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{paginatedList.map((y) => (
						<tr key={y.id}>
							<td>
								{editingYouthId === y.id ? (
									<input
										value={youthForm.name}
										onChange={(e) => setYouthForm(f => ({ ...f, name: e.target.value }))}
									/>
								) : y.name}
							</td>
							<td>
								{editingYouthId === y.id ? (
									<input
										type="date"
										value={youthForm.dob}
										onChange={(e) => setYouthForm(f => ({ ...f, dob: e.target.value }))}
									/>
								) : formatDate(y.dob)}
							</td>
							<td>
								{editingYouthId === y.id ? (
									<span>{youthForm.section}</span>
								) : codeToSectionLabel(y.section)}
							</td>
							<td>
								{editingYouthId === y.id ? (
									<span>{youthForm.membership_stage}</span>
								) : codeToStageLabel(y.membership_stage)}
							</td>
							<td style={{ display: 'flex', gap: '0.5rem' }}>
								{editingYouthId === y.id ? (
									<>
										<button onClick={() => updateYouth(y.id)} title="Confirm"><Check size={16} /></button>
										<button onClick={() => {
											setEditingYouthId(null);
											setYouthForm({ name: '', dob: '', section: '', membership_stage: '' });
										}} title="Cancel"><X size={16} /></button>
									</>
								) : (
									<>
											<button onClick={() => setSelectedYouthDetails(y)} title="View Youth Details"><BookUser size={16} /></button>
											<button
												title="View awarded badges"
												onClick={() => setBadgeModalYouth(y)}
											>
												<Award size={16} />
											</button>

											<button onClick={() => setSelectedYouth(y)} title="View/Edit Transitions"><Link size={16} /></button>
											<button onClick={() => { setEditingYouthId(y.id); setYouthForm(y); }} title="Edit youth"><Pencil size={16} /></button>




										{y.membership_stage === 'Retired' ? (
											<button onClick={() => deleteYouth(y.id)} title="Delete Retired Youth">
												<Trash size={16} />
											</button>
										) : (
											<div title="Only retired youth can be deleted" style={{ opacity: 0.3 }}>
												<Trash size={16} />
											</div>
										)}

									</>
								)}
							</td>
						</tr>
					))}
					{selectedYouth && (
						<TransitionModal
							youth={selectedYouth}
							onClose={() => {
								setSelectedYouth(null);
								fetchYouth(); // Refresh the youth list after closing
							}}
						/>
					)}
					{justAddedYouth && (
						<TransitionModal
							youth={justAddedYouth}
							onClose={() => {
								setJustAddedYouth(null);
								fetchYouth();
							}}
						/>
					)}




					{editingYouthId === null && (
						<tr>
							<td>
								<input
									value={youthForm.name}
									onChange={(e) => setYouthForm(f => ({ ...f, name: e.target.value }))}
								/>
							</td>
							<td>
								<input
									type="date"
									value={youthForm.dob}
									onChange={(e) => setYouthForm(f => ({ ...f, dob: e.target.value }))}
								/>
							</td>
							<td>

							</td>
							<td>

							</td>
							<td>
								<button onClick={addYouth} title="Add youth"><Plus size={16} /></button>
							</td>
						</tr>
					)}
				</tbody>
			</AdminTable>
			{addError && (
				<div style={{ color: 'red', marginBottom: '1rem' }}>
					⚠️ {addError}
				</div>
			)}
			<div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
				<button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
					Previous
				</button>
				<span>Page {currentPage} of {Math.ceil(filteredList.length / itemsPerPage)}</span>
				<button
					onClick={() =>
						setCurrentPage(p => Math.min(p + 1, Math.ceil(filteredList.length / itemsPerPage)))
					}
					disabled={currentPage === Math.ceil(filteredList.length / itemsPerPage)}
				>
					Next
				</button>
			</div>

			{preview && (
				<TerrainSyncModal
					toAdd={preview.toAdd}
					toUpdate={preview.toUpdate}
					onConfirm={confirmSync}
					onCancel={cancelSync}
				/>
			)}
			{showUnitModal && (
				<UnitSelectModal
					units={unitOptions}
					onConfirm={handleUnitsConfirmed}
					onCancel={() => setShowUnitModal(false)}
				/>
			)}
			{selectedYouthDetails && (
				<YouthDetailsModal
					youth={selectedYouthDetails}
					onClose={() => setSelectedYouthDetails(null)}
				/>
			)}
			{showImportModal && (
				<ImportYouthModal
					onClose={() => setShowImportModal(false)}
					onImport={handleYouthImport}
				/>
			)}
			{badgeModalYouth && (
				<BadgeHistoryModal
					youth={badgeModalYouth}
					onClose={() => setBadgeModalYouth(null)}
				/>
			)}
		</div>

	);

}

import { useEffect, useState } from 'react';
import { Tent, Download, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { PageTitle, Select, PrimaryButton, AdminTable } from '@/components/common/SharedStyles';
import { downloadCSV } from '@/utils/exportUtils';
import { supabase } from '@/lib/supabaseClient';


// top of the file, just after imports
function highlight(text, query) {
    if (!query) return text;
    const words = query.trim().split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!words.length) return text;
    const regex = new RegExp(`(${words.join('|')})`, 'gi');
    return text.split(regex).map((part, i) =>
        regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
}
export default function ReportOAS() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const clearFilters = () => {
        setQuery('');
        setOasFilter([]);
        setSubFilter([]);
        setStageFilter([]);
        setCatFilter([]);
    };
    // filters
    const [query, setQuery] = useState('');
    const [oasFilter, setOasFilter] = useState([]);
    const [subFilter, setSubFilter] = useState([]);
    const [stageFilter, setStageFilter] = useState([]);
    const [catFilter, setCatFilter] = useState([]);

    // sort
    const [sortField, setSortField] = useState('stage');
    const [sortDir, setSortDir] = useState('asc');

    const streamLabel = {
        alpine: 'Alpine',
        aquatics: 'Aquatics',
        boating: 'Boating',
        bushwalking: 'Bushwalking',
        bushcraft: 'Bushcraft',
        camping: 'Camping',
        cycling: 'Cycling',
        paddling: 'Paddling',
        vertical: 'Vertical',
  
    };




    // ───────────────────────────────────────────────────────── fetch
    useEffect(() => {
        const fetchRows = async () => {
            setLoading(true);

            let q = supabase
                .from('oas_ref')
                .select(`
          id, stream, substream, stage,
          statement, details,
          category, subcategory
        `);

            if (query)
                q = q.textSearch('ts', query, { type: 'websearch', config: 'english' });
            if (oasFilter.length) q = q.in('stream', oasFilter);
            if (subFilter.length) q = q.in('substream', subFilter);
            if (stageFilter.length) q = q.in('stage', stageFilter.map(Number));
            if (catFilter.length) q = q.in('category', catFilter);

            const { data, error } = await q.order('stage').limit(500);

            if (error) console.error('Supabase error:', error.message);
            setRows(data || []);
            setLoading(false);
        };

        fetchRows();
    }, [query, oasFilter, subFilter, stageFilter, catFilter]);


    // ───────────────────────────────────────────────────────── sort helper
    const sorted = [...rows].sort((a, b) => {
        const av = (a[sortField] ?? '').toString().toLowerCase();
        const bv = (b[sortField] ?? '').toString().toLowerCase();
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const toggleSort = (f) => {
        if (sortField === f) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortField(f); setSortDir('asc'); }
    };

    const handleOasChange = e => {
        const vals = Array.from(e.target.selectedOptions, o => o.value)
            .filter(Boolean);        // drop '' entries
        setOasFilter(vals);
    };
    // ───────────────────────────────────────────────────────── UI
    return (
        <div className="content-box">
            <PageTitle>
                <Tent size={24} style={{ marginRight: 8 }} />
                OAS Library
            </PageTitle>

            {/* search + filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: 16 }}>
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search statements..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        style={{ paddingLeft: 6 }}
                    />
                </div>


                <Select multiple size={6} style={{ minWidth: 160 }} value={oasFilter} onChange={handleOasChange}>
                    <option value="">All OAS</option>
                    {/* hard-code list or fetch distinct values once */}
                     {Object.keys(streamLabel).map(s => (
                          <option key={s} value={s}>{streamLabel[s]}</option>
                         ))}
                </Select>

                <Select multiple size={6} style={{ minWidth: 160 }} value={subFilter} onChange={e => setSubFilter(Array.from(e.target.selectedOptions, o => o.value))}>
                    <option value="">All Substreams</option>
                    {/* could populate dynamically based on oasFilter */}
                    {['cross-country-skiing', 'climbing', 'canoeing', 'mountain-biking'].map(s =>
                        <option key={s} value={s}>{s}</option>
                    )}
                </Select>

                <Select multiple size={6} style={{ minWidth: 160 }}  value={stageFilter} onChange={e => setStageFilter(Array.from(e.target.selectedOptions, o => o.value))}>
                    <option value="">All Stages</option>
                    {Array.from({ length: 9 }, (_, i) => i + 1).map(n =>
                        <option key={n} value={n}>{n}</option>
                    )}
                </Select>

                <Select multiple size={6} style={{ minWidth: 160 }}  value={catFilter} onChange={e => setCatFilter(Array.from(e.target.selectedOptions, o => o.value))}>
                    <option value="">All Categories</option>
                    {[
                        'Planning & Preparation', 'Navigation', 'Camp & Trailcraft',
                        'Safety & Emergency', 'Environmental Awareness',
                        'Teamwork & Leadership', 'Skills & Techniques',
                        'Review & Reflection'
                    ].map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
                <PrimaryButton style={{ background: '#bbb' }} onClick={clearFilters}>
                      Clear filters
                    </PrimaryButton>
                <PrimaryButton onClick={() => downloadCSV(sorted, 'oas_library')}>
                    <Download size={16} style={{ marginRight: 4 }} />
                    CSV
                </PrimaryButton>
            </div>

            {loading && <p>Loading…</p>}
            {!loading && !sorted.length && <p>No matches.</p>}

            {!loading && !!sorted.length && (
                <AdminTable>
                    <thead>
                        <tr>
                            {[
                                ['stream', 'OAS'], ['substream', 'Substream'], ['stage', 'Stage'],
                                ['statement', 'I Statement'], ['details', 'Extra Info'],
                                ['category', 'Category'], ['subcategory', 'Subcategory']
                            ].map(([f, l]) => (
                                <th key={f} onClick={() => toggleSort(f)} style={{ cursor: 'pointer' }}>
                                    {l}
                                    {sortField === f && (
                                        sortDir === 'asc'
                                            ? <ChevronUp size={14} style={{ marginLeft: 4 }} />
                                            : <ChevronDown size={14} style={{ marginLeft: 4 }} />
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {sorted.map(r => (
                            <tr key={r.id}>
                                <td>{streamLabel[r.stream] || r.stream}</td>
                                <td>{r.substream || '-'}</td>
                                <td>{r.stage}</td>
                                <td style={{ fontWeight: 600 }}>{highlight(r.statement, query)}</td>
                                <td>{highlight(r.details, query)}</td>
                                <td>{r.category}</td>
                                <td>{r.subcategory}</td>
                            </tr>
                        ))}
                    </tbody>
                </AdminTable>
            )}
        </div>
    );
}

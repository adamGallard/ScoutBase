import { useEffect, useState } from 'react';
import {
    PageTitle,
    PageWrapper,
    AdminInput,
    PrimaryButton,
    AdminTable
} from '@/components/common/SharedStyles';
import { supabase } from '@/lib/supabaseClient';
import { Trash } from 'lucide-react';

export default function HeaderLinkAdmin({ groupId }) {
    const [links, setLinks] = useState([]);
    const [form, setForm] = useState({ label: '', url: '' });

    useEffect(() => {
        if (groupId) fetchLinks();
    }, [groupId]);

    const fetchLinks = async () => {
        const { data, error } = await supabase
            .from('header_buttons')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: true });

        if (!error) setLinks(data);
    };

    const addLink = async () => {
        if (!form.label || !form.url) return;

        const { error } = await supabase.from('header_buttons').insert([{
            group_id: groupId,
            label: form.label,
            url: form.url,
        }]);

        if (!error) {
            setForm({ label: '', url: '' });
            fetchLinks();
        }
    };

    const deleteLink = async (id) => {
        const { error } = await supabase.from('header_buttons').delete().eq('id', id);
        if (!error) fetchLinks();
    };

    return (
        <PageWrapper>
            <PageTitle>Header Links</PageTitle>

            <div style={{ maxWidth: '600px', marginBottom: '2rem' }}>
                <AdminInput
                    placeholder="Link Label"
                    value={form.label}
                    onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
                />
                <AdminInput
                    placeholder="URL (https://...)"
                    value={form.url}
                    onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))}
                />
                <PrimaryButton onClick={addLink}>Add Link</PrimaryButton>
            </div>

            {links.length > 0 && (
                <AdminTable>
                    <thead>
                        <tr>
                            <th>Label</th>
                            <th>URL</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {links.map(link => (
                            <tr key={link.id}>
                                <td>{link.label}</td>
                                <td>{link.url}</td>
                                <td>
                                    <button onClick={() => deleteLink(link.id)} title="Delete">
                                        <Trash size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </AdminTable>
            )}
        </PageWrapper>
    );
}

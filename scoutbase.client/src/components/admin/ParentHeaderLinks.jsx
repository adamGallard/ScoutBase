// src/components/parent/HeaderLinkAdmin.jsx

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
    const [form, setForm] = useState({
        title: '',
        url: '',
        description: ''
    });

    useEffect(() => {
        if (groupId) fetchLinks();
    }, [groupId]);

    const fetchLinks = async () => {
        const { data, error } = await supabase
            .from('parent_links')
            .select('id,group_id,title,url,description')
            .eq('group_id', groupId)
            .order('created_at', { ascending: true });

        if (!error) setLinks(data);
    };

    const addLink = async () => {
        if (!form.title || !form.url) return;

        const { data, error } = await supabase
            .from('parent_links')
            .insert([{
                group_id: groupId,
                title: form.title,
                url: form.url,
                description: form.description,
            }])
            .select('id,group_id,title,url,description');

        if (error) {
            console.error('Insert error:', error);
            return;
        }

        setForm({ title: '', url: '', description: '' });
        fetchLinks();
    };

    const deleteLink = async (id) => {
        const { error } = await supabase
            .from('parent_links')
            .delete()
            .eq('id', id);

        if (!error) fetchLinks();
    };

    return (
        <PageWrapper>
            <PageTitle>Parent Links</PageTitle>

            <div style={{ maxWidth: '600px', marginBottom: '2rem' }}>
                <AdminInput
                    placeholder="Link title"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
                <AdminInput
                    placeholder="URL (https://...)"
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                />
                <AdminInput
                    placeholder="Description (optional)"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
                <PrimaryButton onClick={addLink}>
                    Add Link
                </PrimaryButton>
            </div>

            {links.length > 0 && (
                <AdminTable>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>URL</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {links.map(link => (
                            <tr key={link.id}>
                                <td>{link.title}</td>
                                <td>{link.url}</td>
                                <td>{link.description}</td>
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

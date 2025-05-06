import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Adjust based on where you initialize Supabase
import { PageTitle, PrimaryButton, SettingsTable, SettingsTableTh, SettingsTableThTd, Label, InputText, ToggleSwitchWrapper, ErrorMessage } from '@/components/common/SharedStyles'; // Importing shared styles
import { Settings } from 'lucide-react'; // Importing icons

const SettingsPage = ({ groupId }) => {
    const [settings, setSettings] = useState({
        twilio_account_sid: '',
        twilio_auth_token: '',
        twilio_messaging_service_sid: '',
        calendar_url: '',
        emailing_direct_enabled: true,
        sms_enabled: true,  // New state for SMS toggle
        email_from_client_enabled: true, // New state for email from client toggle
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [twilioStats, setTwilioStats] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);  // Manage edit mode for Twilio settings

    const getMaskedAuthToken = (authToken) => {
        if (!authToken) return 'N/A';
        return `****${authToken.slice(-4)}`; // Show only the last 4 digits
    };

    const fetchTwilioStats = async (twilioAuthToken, twilioAccountSid) => {
        try {
            const smsResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Usage/Records/AllTime.json?Category=sms`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`)
                }
            });
            const smsData = await smsResponse.json();

            const balanceResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Balance.json`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`)
                }
            });
            const balanceData = await balanceResponse.json();

            if (!smsData.usage_records || !balanceData.balance) {
                console.error('Error fetching valid Twilio data:', smsData, balanceData);
                return { balance: 'N/A', currency: 'N/A', messages_sent: 'N/A' };
            }

            const messagesSent = smsData.usage_records.reduce((total, record) => total + parseInt(record.count || 0), 0);

            return {
                balance: balanceData.balance,
                currency: balanceData.currency,
                messages_sent: messagesSent,
            };
        } catch (error) {
            console.error('Error fetching Twilio stats:', error);
            return { balance: 'N/A', currency: 'N/A', messages_sent: 'N/A' };
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            if (!groupId) {
                setError('Invalid group ID');
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('group_settings')
                    .select('*')
                    .eq('group_id', groupId)
                    .single();

                if (error) throw error;

                setSettings(data);
                setLoading(false);

                if (data.twilio_account_sid && data.twilio_auth_token) {
                    const stats = await fetchTwilioStats(data.twilio_auth_token, data.twilio_account_sid);
                    setTwilioStats(stats);
                }
            } catch (err) {
                setError('Error fetching group settings');
                setLoading(false);
            }
        };

        fetchSettings();
    }, [groupId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings((prevState) => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const rawTwilioAuthToken = settings.twilio_auth_token;

            const { data, error: fetchError } = await supabase
                .from('group_settings')
                .select('*')
                .eq('group_id', groupId)
                .single();

            if (fetchError) throw fetchError;

            let updateError;

            if (data) {
                const { error } = await supabase
                    .from('group_settings')
                    .update({
                        twilio_account_sid: settings.twilio_account_sid,
                        twilio_auth_token: rawTwilioAuthToken,
                        twilio_messaging_service_sid: settings.twilio_messaging_service_sid,
                        calendar_url: settings.calendar_url,
                        emailing_direct_enabled: settings.emailing_direct_enabled,
                        sms_enabled: settings.sms_enabled,
                        email_from_client_enabled: settings.email_from_client_enabled
                    })
                    .eq('group_id', groupId);

                updateError = error;
            } else {
                const { error } = await supabase
                    .from('group_settings')
                    .insert({
                        group_id: groupId,
                        twilio_account_sid: settings.twilio_account_sid,
                        twilio_auth_token: rawTwilioAuthToken,
                        twilio_messaging_service_sid: settings.twilio_messaging_service_sid,
                        calendar_url: settings.calendar_url,
                        emailing_direct_enabled: settings.emailing_direct_enabled,
                        sms_enabled: settings.sms_enabled,
                        email_from_client_enabled: settings.email_from_client_enabled
                    });

                updateError = error;
            }

            if (updateError) throw updateError;

            setLoading(false);
            alert('Settings saved successfully!');
            setIsEditMode(false); // Disable edit mode after saving
        } catch (err) {
            setLoading(false);
            setError('Error saving group settings');
        }
    };

    return (
        <div>
            <PageTitle>
                <Settings size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />Group Settings
            </PageTitle>

            {error && <ErrorMessage>{error}</ErrorMessage>}
            {/* SMS Settings Toggle */}
            <SettingsTable>
                <thead>
                    <tr>
                        <SettingsTableTh colSpan={2}>SMS Settings</SettingsTableTh>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <SettingsTableThTd>
                            <Label>Enable SMS</Label>
                        </SettingsTableThTd>
                        <SettingsTableThTd>
                            <ToggleSwitchWrapper>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        name="sms_enabled"
                                        checked={settings.sms_enabled}
                                        onChange={handleChange}
                                        disabled={!isEditMode}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </ToggleSwitchWrapper>
                        </SettingsTableThTd>
                    </tr>
                </tbody>
            </SettingsTable>
            {/* Twilio Settings Table */}
            <SettingsTable>
                <thead>
                    <tr>
                        <SettingsTableTh colSpan={2}>Twilio Settings</SettingsTableTh>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <SettingsTableThTd>
                            <Label>Twilio Account SID</Label>
                        </SettingsTableThTd>
                        <SettingsTableThTd>
                            <InputText type="text" name="twilio_account_sid" value={settings.twilio_account_sid} onChange={handleChange} disabled={!isEditMode} />
                        </SettingsTableThTd>
                    </tr>
                    <tr>
                        <SettingsTableThTd>
                            <Label>Twilio Auth Token</Label>
                        </SettingsTableThTd>
                        <SettingsTableThTd>
                            {!isEditMode ? (
                                <span>{getMaskedAuthToken(settings.twilio_auth_token)}</span>
                            ) : (
                                <InputText
                                    type="text"
                                    name="twilio_auth_token"
                                    value={settings.twilio_auth_token}
                                    onChange={handleChange}
                                    style={{ width: '200px' }}
                                />
                            )}
                        </SettingsTableThTd>
                    </tr>
                    <tr>
                        <SettingsTableThTd>
                            <Label>Twilio Messaging Service SID</Label>
                        </SettingsTableThTd>
                        <SettingsTableThTd>
                            <InputText type="text" name="twilio_messaging_service_sid" value={settings.twilio_messaging_service_sid} onChange={handleChange} disabled={!isEditMode} />
                        </SettingsTableThTd>
                    </tr>
                    {twilioStats && (
                        <>
                            <tr>
                                <SettingsTableThTd>Twilio Balance</SettingsTableThTd>
                                <SettingsTableThTd>${twilioStats.balance} {twilioStats.currency}</SettingsTableThTd>
                            </tr>
                            <tr>
                                <SettingsTableThTd>Messages Sent</SettingsTableThTd>
                                <SettingsTableThTd>{twilioStats.messages_sent}</SettingsTableThTd>
                            </tr>
                        </>
                    )}
                </tbody>
            </SettingsTable>



            {/* Email from Client Settings Toggle */}
            <SettingsTable>
                <thead>
                    <tr>
                        <SettingsTableTh colSpan={2}>Email Client Settings</SettingsTableTh>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <SettingsTableThTd>
                            <Label>Enable Email from Client</Label>
                        </SettingsTableThTd>
                        <SettingsTableThTd>
                            <ToggleSwitchWrapper>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        name="email_from_client_enabled"
                                        checked={settings.email_from_client_enabled}
                                        onChange={handleChange}
                                        disabled={!isEditMode}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </ToggleSwitchWrapper>
                        </SettingsTableThTd>
                    </tr>
                    <tr>
                        <SettingsTableThTd>
                            <Label>Enable Direct Email</Label>
                        </SettingsTableThTd>
                        <SettingsTableThTd>
                            <ToggleSwitchWrapper>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        name="emailing_direct_enabled"
                                        checked={settings.emailing_direct_enabled}
                                        onChange={handleChange}
                                        disabled={!isEditMode}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </ToggleSwitchWrapper>
                        </SettingsTableThTd>
                    </tr>
                </tbody>
            </SettingsTable>

            <PrimaryButton onClick={() => setIsEditMode(!isEditMode)}>
                {isEditMode ? 'Cancel Edit' : 'Edit Settings'}
            </PrimaryButton>

            <PrimaryButton onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Settings'}
            </PrimaryButton>
        </div>
    );
};

export default SettingsPage;

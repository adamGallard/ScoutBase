import React, { useState } from 'react';
import styled from 'styled-components';
import { Settings, LogOut, MapPin, User, UserRoundCog } from 'lucide-react';
import { TitleGroup, AdminHeaderRow, AdminDropdownContainer, AdminDropdownToggle, AdminDropdownMenu, Label, StyledSelect, ToggleSwitchWrapper, AdminWarningLabel } from '@/components/SharedStyles';
import { logAuditEvent } from '@/helpers/auditHelper';

const AdminHeaderBar = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f9fafb;
  color: Black;
  padding: 0.5rem 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;


const AdminHeader = ({
    userInfo,
    groups,
    activeGroupId,
    setActiveGroupId,
    actingAsAdmin,
    setActingAsAdmin,
    setActingAsGroupId,
    handleLogout
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const currentGroupName = Array.isArray(groups)
        ? groups.find((g) => g.id === userInfo?.group_id)?.name
        : 'Unknown Group';
    return (
        <AdminHeaderBar>
            <TitleGroup>
                <span className="dot" />
                <strong>ScoutBase</strong>
                <span className="tagline">Admin</span>
            </TitleGroup>

            <AdminHeaderRow isWarning={userInfo?.role === 'Super Admin' && actingAsAdmin}>
                {userInfo?.role === 'Super Admin' && actingAsAdmin && (
                    <AdminWarningLabel>⚠️ Acting as Group Leader</AdminWarningLabel>
                )}

                <AdminDropdownContainer>
                    <AdminDropdownToggle onClick={() => setShowDropdown((prev) => !prev)}>
                        <UserRoundCog size={20} color="#0F5BA4" />
                    </AdminDropdownToggle>

                    {showDropdown && (
                        <AdminDropdownMenu>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                                <User size={16} /> {userInfo?.name} ({userInfo?.role})
                            </div>

                            <Label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={16} />
                                {groups.find((g) => g.id === userInfo?.group_id)?.name || 'Unknown Group'}
                            </Label>

                            {userInfo?.role === 'Super Admin' && (
                                <>
                                    <Label>Group:</Label>
                                    <StyledSelect
                                        value={activeGroupId}
                                        onChange={(e) => setActiveGroupId(e.target.value)}
                                    >
                                        {groups.map((g) => (
                                            <option key={g.id} value={g.id}>
                                                {g.name}
                                            </option>
                                        ))}
                                    </StyledSelect>

                                    <ToggleSwitchWrapper>
                                        <span className="text-sm">Act as Group Leader</span>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={actingAsAdmin}
                                                onChange={async (e) => {
                                                    const checked = e.target.checked;
                                                    setActingAsAdmin(checked);
                                                    setActingAsGroupId(checked ? activeGroupId : null);

                                                    await logAuditEvent({
                                                        userId: userInfo.id,
                                                        groupId: activeGroupId,
                                                        role: 'Super Admin',
                                                        action: 'toggle_acting_as_admin',
                                                        targetType: 'group',
                                                        targetId: activeGroupId,
                                                        metadata: { enabled: checked }
                                                    });
                                                }}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </ToggleSwitchWrapper>
                                </>
                            )}

                            <button
                                onClick={handleLogout}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    color: '#dc2626',
                                    fontSize: '1rem',
                                    fontWeight: 300,
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    marginTop: '0.5rem'
                                }}
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </AdminDropdownMenu>
                    )}
                </AdminDropdownContainer>
            </AdminHeaderRow>
        </AdminHeaderBar>
    );
};

export default AdminHeader;

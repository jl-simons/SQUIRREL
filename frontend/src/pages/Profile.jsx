import React, { useEffect } from 'react';

const Profile = () => {
  useEffect(() => {
    const onSaved = () => {
      // Let the layout refresh user info
      window.dispatchEvent(new CustomEvent('squirrel-auth-success'));
    };
    window.addEventListener('message', (e) => {
      const d = e?.data;
      if (!d || d.source !== 'squirrel-backend') return;
      if (d.type === 'profile-saved') onSaved();
    });
    return () => {
      window.removeEventListener('message', () => {});
    };
  }, []);

  return (
    <div className="profile-container">
      <h1>Profile</h1>
      <div className="iframe-container">
        <iframe
          src="/backend/profile?embed=1"
          title="Profile"
          width="100%"
          height="900px"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
};

export default Profile;

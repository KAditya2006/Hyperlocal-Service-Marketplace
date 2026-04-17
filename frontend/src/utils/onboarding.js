export const getDashboardPath = (user) => {
  if (user?.role === 'admin') return '/admin/dashboard';
  if (user?.role === 'worker') return '/worker/dashboard';
  return '/dashboard';
};

export const getPostAuthRedirect = (user) => {
  if (user?.role === 'admin') return '/admin/dashboard';
  if (!user?.canAccessDashboard) return '/profile';
  return getDashboardPath(user);
};

export const getVerificationSource = (user) => {
  if (user?.role === 'worker') {
    return user?.workerProfile?.kyc || { status: 'none' };
  }

  return user?.kyc || { status: 'none' };
};

export const getOnboardingMessage = (user) => {
  const status = user?.verificationStatus || getVerificationSource(user).status || 'none';

  if (user?.canAccessDashboard) {
    return 'Your account is verified. Dashboard access is unlocked.';
  }

  if (!user?.profileComplete && status === 'none') {
    return 'Complete your profile and upload your verification document to request admin approval.';
  }

  if (status === 'pending') {
    return 'Your profile is complete. Admin verification is pending.';
  }

  if (status === 'rejected') {
    return 'Your verification was rejected. Update your profile and upload a clearer document.';
  }

  return 'Complete your profile and submit verification before opening your dashboard.';
};

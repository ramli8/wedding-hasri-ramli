// Placeholder kosong untuk menggantikan SignOutAction
export const useSignOutAction = () => {
  const signOut = () => {
    // Tidak melakukan apa-apa karena tidak ada sistem otentikasi
    console.log('Sign out function - no authentication system');
  };

  return {
    signOut
  };
};
import { ReactNode, createContext } from 'react';

// Placeholder kosong untuk menggantikan AccountInfoProvider
const AccountInfoContext = createContext<any>(undefined);

export function AccountInfoProvider({ children }: { children: ReactNode }) {
  return (
    <AccountInfoContext.Provider value={undefined}>
      {children}
    </AccountInfoContext.Provider>
  );
}

export default AccountInfoContext;
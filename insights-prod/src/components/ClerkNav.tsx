'use client';

import { useEffect, useState } from 'react';

export default function ClerkNav() {
  const [clerkAvailable, setClerkAvailable] = useState(false);
  const [UserButton, setUserButton] = useState<any>(null);
  const [SignInButton, setSignInButton] = useState<any>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (!key) return;

    import('@clerk/nextjs').then(({ UserButton: UB, SignInButton: SIB, useUser }) => {
      setUserButton(() => UB);
      setSignInButton(() => SIB);
      setClerkAvailable(true);
    }).catch(() => {});
  }, []);

  if (!clerkAvailable || !UserButton || !SignInButton) return null;

  const ClerkButtons = () => {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { isSignedIn: signed } = require('@clerk/nextjs').useUser();
      if (signed) return <UserButton afterSignOutUrl="/" />;
      return (
        <SignInButton mode="modal">
          <button style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '7px 16px', borderRadius: 8, fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
            Sign In
          </button>
        </SignInButton>
      );
    } catch {
      return null;
    }
  };

  return <ClerkButtons />;
}

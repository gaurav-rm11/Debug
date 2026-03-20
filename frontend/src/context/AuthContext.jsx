import React, { createContext, useContext, useState, useEffect } from 'react';
import { connectWallet } from '../lib/web3';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);

  const login = async () => {
    const data = await connectWallet();
    if (data?.account) {
      setAccount(data.account);
      await fetchUserProfile(data.account);
    }
  };

  const logout = () => {
    setAccount(null);
    setUserProfile(null);
    setIsNewUser(false);
  };

  const fetchUserProfile = async (address) => {
    const { data } = await supabase.from('users').select('*').eq('wallet_address', address).single();
    if (data) {
      setUserProfile(data);
      setIsNewUser(!data.name); // If no name/email, they need onboarding
    } else {
      setIsNewUser(true);
    }
  };

  return (
    <AuthContext.Provider value={{ account, userProfile, isNewUser, setIsNewUser, fetchUserProfile, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

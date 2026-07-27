/** Point d'entrée : redirige vers l'onboarding ou l'app selon l'état du profil. */

import React from 'react';
import { Redirect } from 'expo-router';
import { useProfileStore } from '@/stores/profileStore';

export default function Index() {
  const profile = useProfileStore((s) => s.profile);
  return <Redirect href={profile ? '/(tabs)' : '/onboarding'} />;
}

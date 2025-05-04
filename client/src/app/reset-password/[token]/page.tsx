import { Metadata } from 'next';
import ResetPasswordClient from './ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Reset Password | NERDC Journal',
  description: 'Reset your password for NERDC Journal',
};

export default async function ResetPasswordPage({ params }: { params: { token: string } }) {
    const resolvedParams = await params;
    return <ResetPasswordClient token={resolvedParams.token} />;
  }
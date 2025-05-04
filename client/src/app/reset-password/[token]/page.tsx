import { Metadata } from 'next';
// import ResetPasswordClient from './ResetPasswordClient';



export function generateMetadata(): Metadata {
  return {
    title: 'Reset Password | NERDC Journal',
    description: 'Reset your password for NERDC Journal',
  };
}

// This fixes the token parameter extraction in Next.js
export default function Page() {
//   const token = params.token;
  
  // Pass the extracted token to the client component
  return (
    // <ResetPasswordClient token={token} />
    <div>
        <h1>Reset Password</h1>
    </div>
  );
}
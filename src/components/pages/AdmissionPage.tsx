'use client';

import Admission from '@/components/madrasa/Admission';
import OnlineAdmission from '@/components/madrasa/OnlineAdmission';

export default function AdmissionPage() {
  return (
    <div className="pt-0">
      <Admission hideHeading />
      <OnlineAdmission hideHeading />
    </div>
  );
}

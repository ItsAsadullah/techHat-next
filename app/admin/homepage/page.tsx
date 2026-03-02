import { redirect } from 'next/navigation';

export default function OldHomepagePage() {
  redirect('/admin/settings/homepage');
}

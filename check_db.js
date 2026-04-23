import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://ipdosmdjbcftcbqhxqle.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZG9zbWRqYmNmdGNicWh4cWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg5OTgzNCwiZXhwIjoyMDkyNDc1ODM0fQ.oayb3Elob4f9QR2QfkXiJnzyDLPO5VH_yQaN0E1jKBw'
);

async function checkImages() {
    const { data: settings } = await supabase.from('shop_settings').select('*');
    
    const logo = settings?.find(s => s.key === 'shop_logo');
    const gallery = settings?.find(s => s.key === 'shop_gallery');
    const barber = await supabase.from('barbers').select('photo').single();

    console.log('Logo length:', logo?.value?.length || 0);
    console.log('Gallery type:', typeof gallery?.value);
    console.log('Barber photo length:', barber.data?.photo?.length || 0);
}

checkImages();

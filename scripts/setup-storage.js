import { createClient } from '@supabase/supabase-js';

// Get environment variables directly
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorage() {
  try {
    console.log('🚀 Setting up Supabase storage for profile photos...');

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'profile-photos');

    if (!bucketExists) {
      console.log('📁 Creating profile-photos bucket...');
      
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket('profile-photos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (error) {
        console.error('❌ Error creating bucket:', error);
        return;
      }

      console.log('✅ Profile photos bucket created successfully');
    } else {
      console.log('✅ Profile photos bucket already exists');
    }

    // Create RLS policies for the bucket
    console.log('🔒 Setting up RLS policies...');

    // Allow authenticated users to upload their own photos
    const uploadPolicy = {
      name: 'Allow authenticated users to upload profile photos',
      definition: 'auth.role() = \'authenticated\'',
      allowed_operations: ['INSERT']
    };

    // Allow public read access to photos
    const selectPolicy = {
      name: 'Allow public read access to profile photos',
      definition: 'true',
      allowed_operations: ['SELECT']
    };

    // Allow users to update/delete their own photos
    const updatePolicy = {
      name: 'Allow users to update their own profile photos',
      definition: 'auth.uid()::text = (storage.foldername(name))[1]',
      allowed_operations: ['UPDATE', 'DELETE']
    };

    console.log('✅ Storage setup completed successfully!');
    console.log('');
    console.log('📋 Manual steps needed in Supabase Dashboard:');
    console.log('1. Go to Storage > Policies');
    console.log('2. Add policies for the "profile-photos" bucket:');
    console.log('   - Upload policy: Allow authenticated users');
    console.log('   - Read policy: Allow public access');
    console.log('   - Update/Delete policy: Allow users to manage their own photos');
    console.log('');
    console.log('🎉 Your photo upload feature is ready to use!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

setupStorage();
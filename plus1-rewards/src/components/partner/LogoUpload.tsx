// src/components/partner/LogoUpload.tsx
import { useState, useRef } from 'react';
import { supabase, supabaseAdmin } from '../../lib/supabase';

interface LogoUploadProps {
  currentLogoUrl?: string;
  onLogoUpdate: (logoUrl: string) => void;
  partnerId: string;
}

export default function LogoUpload({ currentLogoUrl, onLogoUpdate, partnerId }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${partnerId}-banner-${Date.now()}.${fileExt}`;
      const filePath = `partner-banners/${fileName}`;

      // Upload file to Supabase Storage using admin client
      const { error: uploadError } = await supabaseAdmin.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Update partner record with new logo URL using regular client
      const { error: updateError } = await supabase
        .from('partners')
        .update({ store_logo_url: publicUrl })
        .eq('id', partnerId);

      if (updateError) throw updateError;

      // Delete old banner if it exists
      if (currentLogoUrl && currentLogoUrl.includes('partner-banners/')) {
        const oldPath = currentLogoUrl.split('/').slice(-2).join('/');
        await supabaseAdmin.storage.from('documents').remove([oldPath]);
      }

      onLogoUpdate(publicUrl);
    } catch (error: any) {
      console.error('Error uploading banner:', error);
      setError(error.message || 'Failed to upload banner');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!currentLogoUrl) return;

    setUploading(true);
    try {
      // Update partner record to remove logo URL
      const { error: updateError } = await supabase
        .from('partners')
        .update({ store_logo_url: null })
        .eq('id', partnerId);

      if (updateError) throw updateError;

      // Delete file from storage if it's in our partner-banners folder
      if (currentLogoUrl.includes('partner-banners/')) {
        const filePath = currentLogoUrl.split('/').slice(-2).join('/');
        await supabaseAdmin.storage.from('documents').remove([filePath]);
      }

      onLogoUpdate('');
    } catch (error: any) {
      console.error('Error removing banner:', error);
      setError(error.message || 'Failed to remove banner');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#1a558b]">image</span>
        Shop Banner
      </h3>

      <div className="space-y-4">
        {/* Current Banner Display */}
        {currentLogoUrl ? (
          <div className="flex items-center gap-4">
            <div className="w-44 h-20 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
              <img
                src={currentLogoUrl}
                alt="Shop Banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-gray-400">broken_image</span>';
                }}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Current banner</p>
              <button
                onClick={handleRemoveLogo}
                disabled={uploading}
                className="text-red-600 hover:text-red-700 text-sm font-semibold disabled:opacity-50"
              >
                Remove Banner
              </button>
            </div>
          </div>
        ) : (
          <div className="w-44 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            <span className="material-symbols-outlined text-gray-400 text-2xl">add_photo_alternate</span>
          </div>
        )}

        {/* Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">upload</span>
                {currentLogoUrl ? 'Change Banner' : 'Upload Banner'}
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-700 text-sm font-semibold mb-1">Banner Guidelines:</p>
          <ul className="text-blue-600 text-xs space-y-1">
            <li>• Recommended size: 220x100 pixels or larger</li>
            <li>• Supported formats: JPG, PNG, GIF</li>
            <li>• Maximum file size: 2MB</li>
            <li>• Landscape banners work best</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
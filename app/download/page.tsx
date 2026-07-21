'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Download, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface PhotostripRecord {
  id: string;
  filename: string;
  image_url: string;
  created_at: string;
}

const DownloadContent: React.FC = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [photostrip, setPhotostrip] = useState<PhotostripRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);

  useEffect(() => {
    if (!id) {
      setError('Invalid download link. Missing photostrip ID.');
      setLoading(false);
      return;
    }

    async function fetchPhotostrip() {
      try {
        const { data, error: dbError } = await supabase
          .from('photostrips')
          .select('id, filename, image_url, created_at')
          .eq('id', id)
          .maybeSingle();

        if (dbError) {
          throw dbError;
        }

        if (data) {
          setPhotostrip(data);
        } else {
          setError('We could not find this photostrip. It might have been deleted.');
        }
      } catch (err: any) {
        console.error('Error fetching photostrip details:', err);
        setError('Failed to connect to the server. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchPhotostrip();
  }, [id]);

  const handleDownload = async () => {
    if (!photostrip) return;
    setDownloading(true);
    try {
      // Fetch the image as a blob to bypass CORS and force phone browsers to trigger file download
      const response = await fetch(`${photostrip.image_url}?t=${Date.now()}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = photostrip.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up local URL
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Failed to trigger automatic download:', err);
      // Fallback: Open in new window if fetch fails
      window.open(photostrip.image_url, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold">
          Fetching your photostrip...
        </p>
      </div>
    );
  }

  if (error || !photostrip) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto">
        <div className="rounded-full bg-rose-500/10 p-4 text-rose-500 border border-rose-500/15 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
          Unable to Load Photo
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
          {error || 'The photo may still be uploading to the cloud. Please wait a moment and try refreshing.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center py-6 px-4 max-w-md mx-auto w-full">
      {/* Event Header Brand */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-black bg-gradient-to-r from-indigo-500 via-[#8B5CF6] to-[#FF0055] bg-clip-text text-transparent uppercase tracking-wider flex items-center justify-center gap-1.5">
          <ImageIcon className="h-5 w-5 text-indigo-500" />
          SSiTE Photobooth
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold mt-1 tracking-wider">
          Download Your Memory
        </p>
      </div>

      {/* Photostrip Card */}
      <div className="relative w-[180px] sm:w-[200px] aspect-[1/3] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white">
        <img
          src={`${photostrip.image_url}?t=${Date.now()}`}
          alt={photostrip.filename}
          className="w-full h-full object-cover select-none"
        />
      </div>

      {/* Download Action Section */}
      <div className="w-full mt-8 flex flex-col gap-4">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="group relative overflow-hidden bg-slate-900 dark:bg-white/5 border-0 text-white hover:text-[#060814] transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50 w-full h-14 flex items-center justify-center font-bold text-base rounded-xl"
        >
          <div className="absolute inset-0 bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1)" />
          {downloading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-3 z-10" />
          ) : (
            <Download className="h-5 w-5 text-[#ff0055] group-hover:text-[#060814] mr-3 z-10" />
          )}
          <span className="z-10">{downloading ? 'Downloading...' : 'DOWNLOAD PHOTOSTRIP'}</span>
        </button>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed px-4">
          💡 <strong>Tip:</strong> You can also <strong>press and hold</strong> the image above to save it directly to your phone's photo library.
        </p>
      </div>

      {/* Footer Branding */}
      <div className="mt-12 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
        Captured: {new Date(photostrip.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
    </div>
  );
};

export default function DownloadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-400 text-sm font-semibold">Loading download portal...</p>
        </div>
      }
    >
      <DownloadContent />
    </Suspense>
  );
}

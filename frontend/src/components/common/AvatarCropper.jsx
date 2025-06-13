// src/components/common/AvatarCropper.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
// Fai risalire di due livelli per utils/api.js
import api from 'lib/api';
import Cropper from 'react-easy-crop';
import getCroppedImg from 'lib/cropImage';
import { Avatar, AvatarImage, AvatarFallback } from 'ui/avatar';
import { PencilIcon, CheckIcon, XIcon } from 'lucide-react';
import { Button } from 'ui/button';
import { useAuth } from '../../context/AuthContext';


export default function AvatarCropper() {
  const { user, updateUser } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState(user.photoURL ?? user.avatar);
  const fileInputRef = useRef(null);

  const [showCrop, setShowCrop] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    setAvatarPreview(user.photoURL ?? user.avatar);
  }, [user.photoURL, user.avatar]);

  const onFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    setShowCrop(true);
  };

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const uploadCroppedImage = async () => {
    try {
      const blob = await getCroppedImg(cropSrc, croppedAreaPixels);
      const form = new FormData();
      form.append('avatar', blob, 'avatar.jpg');
      const res = await api.post(
        'http://localhost:5000/api/user/avatar',
        form,
        { withCredentials: true }
      );
      if (res.data.success) {
        updateUser({ ...user, avatar: res.data.avatarUrl });
      }
    } catch (err) {
      console.error(err);
    } finally {
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      setShowCrop(false);
    }
  };

  return (
    <>
      <div className="relative inline-block">
        <Avatar className="w-24 h-24 mx-auto mb-4">
          <AvatarImage src={avatarPreview} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <button
          type="button"
          className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white rounded-full p-1 hover:bg-gray-100"
          onClick={() => fileInputRef.current.click()}
          aria-label="Modifica avatar"
        >
          <PencilIcon className="h-4 w-4 text-gray-600" />
        </button>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={onFileSelected}
        />
      </div>

      {showCrop && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-full p-4 w-80 h-80 relative">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
            <div className="absolute bottom-4 left-4 right-4 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCrop(false)}
              >
                Annulla
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={uploadCroppedImage}
              >
                Conferma
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

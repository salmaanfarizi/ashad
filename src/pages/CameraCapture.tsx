import { useEffect, useRef, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Camera, MapPin, Upload, X, Image, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PhotoCapture {
  id: string;
  image_url: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  notes: string | null;
  captured_at: string;
}

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captures, setCaptures] = useState<PhotoCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>("");
  const [showCamera, setShowCamera] = useState(false);
  const [notes, setNotes] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchCaptures();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  async function fetchCaptures() {
    try {
      const { data, error } = await supabase
        .from("photo_captures")
        .select("*")
        .order("captured_at", { ascending: false });

      if (data) setCaptures(data);
    } catch (error) {
      console.error("Error fetching captures:", error);
    } finally {
      setLoading(false);
    }
  }

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
      getLocation();
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Could not access camera. Please check permissions.");
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setCapturedImage(null);
    setNotes("");
  }

  function getLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });

          // Try to get address using reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            if (data.display_name) {
              setAddress(data.display_name);
            }
          } catch (error) {
            console.error("Error getting address:", error);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Could not get location. Please enable location services.");
        },
        { enableHighAccuracy: true }
      );
    }
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageData);
      }
    }
  }

  async function saveCapture() {
    if (!capturedImage) return;

    setCapturing(true);
    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Upload to storage
      const fileName = `capture_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, blob, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("photos")
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase.from("photo_captures").insert({
        image_url: urlData.publicUrl,
        latitude: location?.lat || null,
        longitude: location?.lng || null,
        address: address || null,
        notes: notes || null,
        captured_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      toast.success("Photo saved with location!");
      stopCamera();
      fetchCaptures();
    } catch (error) {
      console.error("Error saving capture:", error);
      toast.error("Failed to save photo");
    } finally {
      setCapturing(false);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("photo_captures").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete photo");
      return;
    }
    toast.success("Photo deleted");
    fetchCaptures();
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title font-heading">Camera Capture</h1>
          <p className="page-description">Take photos with automatic location recording</p>
        </div>
        {!showCamera && (
          <button onClick={startCamera} className="btn-primary flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Open Camera
          </button>
        )}
      </div>

      {/* Camera View */}
      {showCamera && (
        <div className="stat-card mb-8 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Camera</h3>
            <button onClick={stopCamera} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative aspect-video bg-foreground/10 rounded-xl overflow-hidden mb-4">
            {!capturedImage ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Location Info */}
          {location && (
            <div className="flex items-start gap-2 p-4 bg-primary/5 rounded-lg mb-4">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Location Recorded</p>
                <p className="text-xs text-muted-foreground">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
                {address && (
                  <p className="text-xs text-muted-foreground mt-1">{address}</p>
                )}
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                placeholder="Add a note about this photo..."
              />
            </div>
          )}

          <div className="flex gap-3">
            {!capturedImage ? (
              <button onClick={capturePhoto} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Camera className="h-4 w-4" />
                Capture Photo
              </button>
            ) : (
              <>
                <button
                  onClick={() => setCapturedImage(null)}
                  className="btn-secondary flex-1"
                >
                  Retake
                </button>
                <button
                  onClick={saveCapture}
                  disabled={capturing}
                  className="btn-success flex-1 flex items-center justify-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {capturing ? "Saving..." : "Save Photo"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Photo Gallery */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Captured Photos</h3>
        {captures.length === 0 ? (
          <div className="stat-card text-center py-12">
            <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No photos captured yet</p>
            <p className="text-sm text-muted-foreground">
              Use the camera to take photos with automatic location
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {captures.map((capture) => (
              <div
                key={capture.id}
                className="stat-card overflow-hidden p-0 animate-fade-in"
              >
                <div className="aspect-video relative">
                  <img
                    src={capture.image_url}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleDelete(capture.id)}
                    className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      {capture.latitude && capture.longitude ? (
                        <>
                          <p className="text-xs text-muted-foreground">
                            {capture.latitude.toFixed(6)}, {capture.longitude.toFixed(6)}
                          </p>
                          {capture.address && (
                            <p className="text-xs text-muted-foreground truncate">
                              {capture.address}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No location data</p>
                      )}
                    </div>
                  </div>
                  {capture.notes && (
                    <p className="text-sm text-foreground">{capture.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(capture.captured_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

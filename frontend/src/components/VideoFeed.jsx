import React, { useRef, useEffect } from 'react';

export const Vid = () => {
  const videoRef = useRef();

  useEffect(() => {
    const constraints = { video: true };

    async function getMediaStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing user media:', error);
      }
    }

    getMediaStream();

    return () => {
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();

        tracks.forEach(track => {
          track.stop();
        });
      }
    };
  }, []);

  const testStyle={
    textAlign : 'center',
    color : 'white',
  }
  return (
    <>
    <video ref={videoRef} autoPlay playsInline  />
    <h1 style={testStyle}>Happy</h1>
    </>
  );
}

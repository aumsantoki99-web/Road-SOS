import { useState, useEffect, useCallback, useRef } from 'react'
import { triggerSosCall } from '../services/api'
import { Capacitor, registerPlugin } from '@capacitor/core'

const SmsSender = registerPlugin('SmsSender')

/**
 * Custom hook for SOS emergency system.
 * Handles countdown, siren audio, and server call trigger.
 */
export function useSos(position, categoryLabel, onToast, profile) {
  const [isSosActive, setIsSosActive] = useState(false)
  const [sosCountdown, setSosCountdown] = useState(10)
  const [currentCallSid, setCurrentCallSid] = useState(null)

  const timerRef = useRef(null)
  const audioRef = useRef(null)

  // Create siren audio context
  const playSiren = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.type = 'sawtooth'
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime)
      oscillator.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 0.5)
      oscillator.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 1)

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      oscillator.start()

      audioRef.current = { oscillator, audioCtx, gainNode }

      // Loop the siren
      const loopInterval = setInterval(() => {
        try {
          oscillator.frequency.setValueAtTime(440, audioCtx.currentTime)
          oscillator.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 0.5)
          oscillator.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 1)
        } catch {
          clearInterval(loopInterval)
        }
      }, 1000)

      audioRef.current.loopInterval = loopInterval
    } catch (err) {
      console.warn('Could not play siren:', err)
    }
  }, [])

  const stopSiren = useCallback(() => {
    if (audioRef.current) {
      try {
        if (audioRef.current.loopInterval) {
          clearInterval(audioRef.current.loopInterval)
        }
        audioRef.current.oscillator.stop()
        audioRef.current.audioCtx.close()
      } catch {
        // already stopped
      }
      audioRef.current = null
    }
  }, [])

  const cancelSos = useCallback(
    (triggerServer = false) => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      stopSiren()
      setIsSosActive(false)
      setSosCountdown(10)

      if (triggerServer && position) {
        const smsPhone = import.meta.env.VITE_EMERGENCY_PHONE || '+917359129704';
        
        // Append profile data to SMS: SOS|lat|lng|category|name|age|bloodGroup|conditions|phone|gender
        let smsBody = `SOS|${position.latitude}|${position.longitude}|${categoryLabel}`;
        if (profile) {
          smsBody += `|${profile.name || ''}|${profile.age || ''}|${profile.bloodGroup || ''}|${profile.conditions || 'None reported'}|${profile.phone || ''}|${profile.gender || ''}`;
        }

        // STEP 1: Always send SMS immediately
        if (Capacitor.isNativePlatform()) {
          onToast?.('📱 Sending emergency SMS automatically...', '#7C3AED');
          SmsSender.sendSms({ phoneNumber: smsPhone, message: smsBody })
            .then(() => {
              onToast?.('✅ SMS sent automatically in background!', '#059669');
            })
            .catch((err) => {
              console.error('Background SMS failed:', err);
              onToast?.('⚠️ Background SMS failed. Opening SMS app...', '#B45309');
              // Fallback to manual intent
              try {
                window.location.href = `sms:${smsPhone}?body=${encodeURIComponent(smsBody)}`;
              } catch (e) {
                console.error('Manual SMS launch failed:', e);
              }
            });
        } else {
          onToast?.('📱 Opening prefilled SMS...', '#7C3AED');
          try {
            window.location.href = `sms:${smsPhone}?body=${encodeURIComponent(smsBody)}`;
          } catch (e) {
            console.error('Manual SMS launch failed:', e);
          }
        }

        // STEP 2: If online, also call the server for AI voice call
        if (navigator.onLine) {
          setTimeout(() => {
            onToast?.('📡 Requesting AI emergency voice dispatch...', '#7C3AED');
            triggerSosCall(position.latitude, position.longitude, categoryLabel, profile)
              .then((data) => {
                if (data && data.success) {
                  onToast?.('📞 AI agent is calling operator now!', '#059669');
                  if (data.call_sid) {
                    setCurrentCallSid(data.call_sid);
                  }
                } else {
                  const errMsg = (data && data.error) ? data.error : 'Unknown server-side failure';
                  console.error('Server call failed with error:', errMsg);
                  onToast?.(`⚠️ Call failed: ${errMsg}`, '#B45309');
                }
              })
              .catch((err) => {
                console.error('Server call failed:', err);
                onToast?.('⚠️ Server call failed. Helper phone will route via MacroDroid.', '#B45309');
              });
          }, 1500);
        } else {
          onToast?.('📵 Device offline — Helper phone will trigger AI call via MacroDroid.', '#B45309');
        }
      } else if (!triggerServer) {
        onToast?.('✅ SOS Cancelled - You are safe.', '#059669');
      }
    },
    [position, categoryLabel, stopSiren, onToast, profile]
  )

  const triggerSos = useCallback(() => {
    if (!position) {
      onToast?.('📍 Getting GPS — try in 5 seconds', '#1D4ED8')
      return
    }

    setIsSosActive(true)
    setSosCountdown(10)
    playSiren()

    let count = 10
    timerRef.current = setInterval(() => {
      count--
      if (count <= 0) {
        cancelSos(true)
      } else {
        setSosCountdown(count)
      }
    }, 1000)
  }, [position, playSiren, cancelSos, onToast])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      stopSiren()
    }
  }, [stopSiren])

  return {
    isSosActive,
    sosCountdown,
    currentCallSid,
    triggerSos,
    cancelSos,
  }
}

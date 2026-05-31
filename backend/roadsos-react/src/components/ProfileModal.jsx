import { useState, useEffect } from 'react'
import { HeartPulse, Calendar, ShieldAlert, Check, X } from 'lucide-react'

export default function ProfileModal({ onClose, isForceOnboarding = false }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [dob, setDob] = useState('')
  const [age, setAge] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [conditions, setConditions] = useState('')
  const [error, setError] = useState('')

  // Blood group choices
  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

  // Load existing profile if any
  useEffect(() => {
    const savedProfile = localStorage.getItem('roadsos_user_profile')
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile)
        setName(parsed.name || '')
        setPhone(parsed.phone || '')
        setGender(parsed.gender || '')
        setDob(parsed.dob || '')
        setBloodGroup(parsed.bloodGroup || '')
        setConditions(parsed.conditions || '')
      } catch (e) {
        console.error('Failed to parse saved user profile:', e)
      }
    }
  }, [])

  // Auto-calculate age on date of birth change
  useEffect(() => {
    if (!dob) {
      setAge('')
      return
    }
    const birthDate = new Date(dob)
    const today = new Date()
    let calculatedAge = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--
    }
    
    setAge(calculatedAge >= 0 ? calculatedAge : '')
  }, [dob])

  const handleSave = (e) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!phone.trim()) {
      setError('Please enter your phone number.')
      return
    }
    if (!gender) {
      setError('Please select your gender.')
      return
    }
    if (!dob) {
      setError('Please select your Date of Birth.')
      return
    }
    if (!bloodGroup) {
      setError('Please select your Blood Group.')
      return
    }

    const profileData = {
      name: name.trim(),
      phone: phone.trim(),
      gender,
      dob,
      age: parseInt(age) || 0,
      bloodGroup,
      conditions: conditions.trim() || 'None reported'
    }

    localStorage.setItem('roadsos_user_profile', JSON.stringify(profileData))
    localStorage.setItem('roadsos_profile_setup_done', 'true')
    
    if (onClose) {
      onClose(profileData)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md px-4 py-6 overflow-y-auto">
      <div 
        className="glass-dark w-full max-w-md rounded-[24px] p-6 sm:p-8 animate-fade-in-up border border-white/10 shadow-2xl relative"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Close Button (only if not forced onboarding) */}
        {!isForceOnboarding && onClose && (
          <button 
            onClick={() => onClose()}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mb-3">
            <HeartPulse className="w-6 h-6 text-red-500 animate-pulse" />
          </div>
          <h2 className="text-white font-bold text-xl sm:text-2xl tracking-tight">
            {isForceOnboarding ? 'Set Up Your Medical ID' : 'RoadSOS Medical ID'}
          </h2>
          <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-xs leading-relaxed">
            This profile data is saved locally on your device and will be shared automatically to help first responders save your life during an SOS.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-[14px] p-3 text-red-400 text-xs flex items-center gap-2 mb-4 animate-shake">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              placeholder="e.g. John Doe"
              className="w-full bg-white/5 border border-white/8 focus:border-blue-500 focus:bg-white/10 rounded-[14px] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all"
              required
            />
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                setError('')
              }}
              placeholder="e.g. +91 98765 43210"
              className="w-full bg-white/5 border border-white/8 focus:border-blue-500 focus:bg-white/10 rounded-[14px] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all"
              required
            />
          </div>

          {/* DOB & Age Field Row */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3">
              <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                Date of Birth
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => {
                    setDob(e.target.value)
                    setError('')
                  }}
                  className="w-full bg-white/5 border border-white/8 focus:border-blue-500 focus:bg-white/10 rounded-[14px] px-4 py-3 text-sm text-white outline-none transition-all appearance-none"
                  style={{ colorScheme: 'dark' }}
                  required
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                Calculated Age
              </label>
              <div className="w-full bg-white/5 border border-white/5 rounded-[14px] px-4 py-3 text-sm text-white/60 font-mono text-center font-bold">
                {age !== '' ? `${age} yrs` : '--'}
              </div>
            </div>
          </div>

          {/* Gender Field */}
          <div>
            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
              Gender
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Male', 'Female', 'Other'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setGender(g)
                    setError('')
                  }}
                  className={`py-2 rounded-[10px] text-xs font-bold transition-all border ${
                    gender === g
                      ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Blood Group Field */}
          <div>
            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
              Blood Group
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => {
                    setBloodGroup(bg)
                    setError('')
                  }}
                  className={`py-2 rounded-[10px] text-xs font-bold transition-all border ${
                    bloodGroup === bg
                      ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Medical Conditions Field */}
          <div>
            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
              Medical Conditions / Allergies
            </label>
            <textarea
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="e.g. Asthma, Diabetes, Penicillin Allergy, none, etc."
              rows="3"
              className="w-full bg-white/5 border border-white/8 focus:border-blue-500 focus:bg-white/10 rounded-[14px] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full btn mt-2 py-3.5 rounded-[16px] text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.01]"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
            }}
          >
            <Check className="w-4 h-4" />
            Save Profile
          </button>
        </form>
      </div>
    </div>
  )
}

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  usePatientStore, 
  initVitalsListener, 
  initMedicalHistoryListener, 
  initClinicalNotesListener,
  Vital 
} from '@/src/app/store/patientStore';
import { useAuthStore } from '@/src/app/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Input } from '@/src/components/ui/Input';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  FileText, 
  Activity, 
  Heart, 
  Thermometer,
  Stethoscope,
  Plus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/cn';
import { formatRelativeTime, formatDate, formatDateTime } from '@/src/utils/date';

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    patients, 
    vitals: allVitals, 
    medicalHistory: allHistory,
    clinicalNotes: allNotes,
    addVital,
    updatePatient,
    addMedicalHistory,
    addClinicalNote
  } = usePatientStore();
  
  const patient = patients.find(p => p.id === id);
  const patientVitals = id ? allVitals[id] || [] : [];
  const patientHistory = id ? allHistory[id] || [] : [];
  const patientNotes = id ? allNotes[id] || [] : [];

  const [isVitalModalOpen, setIsVitalModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const [newVital, setNewVital] = useState({
    type: 'Heart Rate' as Vital['type'],
    value: '',
    unit: 'bpm'
  });

  const [editData, setEditData] = useState({
    name: '',
    age: 0,
    gender: 'Male' as any,
    status: 'Stable' as any,
    phone: '',
    email: '',
    condition: '',
    address: '',
    bloodGroup: ''
  });

  const [newHistory, setNewHistory] = useState({
    title: '',
    doctor: user?.displayName || 'Dr. Naved',
    status: 'Completed',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [newNote, setNewNote] = useState({
    content: '',
    doctor: user?.displayName || 'Dr. Naved'
  });

  useEffect(() => {
    if (id) {
      const unsubVitals = initVitalsListener(id);
      const unsubHistory = initMedicalHistoryListener(id);
      const unsubNotes = initClinicalNotesListener(id);
      return () => {
        unsubVitals();
        unsubHistory();
        unsubNotes();
      };
    }
  }, [id]);

  useEffect(() => {
    if (patient) {
      setEditData({
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        status: patient.status,
        phone: patient.phone,
        email: patient.email,
        condition: patient.condition,
        address: patient.address || '',
        bloodGroup: patient.bloodGroup || ''
      });
    }
  }, [patient]);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold text-slate-900">Patient not found</h2>
        <Button onClick={() => navigate('/patients')} className="mt-4">Back to Patients</Button>
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Stable': return 'success';
      case 'Critical': return 'error';
      case 'Recovering': return 'warning';
      default: return 'default';
    }
  };

  const handleAddVital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    await addVital(id, newVital);
    setIsVitalModalOpen(false);
    setNewVital({ type: 'Heart Rate', value: '', unit: 'bpm' });
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    await updatePatient(id, editData);
    setIsEditModalOpen(false);
  };

  const handleAddHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    await addMedicalHistory(id, newHistory);
    setIsHistoryModalOpen(false);
    setNewHistory({
      title: '',
      doctor: user?.displayName || 'Dr. Naved',
      status: 'Completed',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    await addClinicalNote(id, newNote);
    setIsNoteModalOpen(false);
    setNewNote({
      content: '',
      doctor: user?.displayName || 'Dr. Naved'
    });
  };

  const latestVitals = {
    'Heart Rate': patientVitals.find(v => v.type === 'Heart Rate'),
    'Blood Pressure': patientVitals.find(v => v.type === 'Blood Pressure'),
    'Temperature': patientVitals.find(v => v.type === 'Temperature'),
    'Oxygen Level': patientVitals.find(v => v.type === 'Oxygen Level'),
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/patients')} className="rounded-full">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
            <Badge variant={getStatusVariant(patient.status)}>{patient.status}</Badge>
          </div>
          <p className="text-slate-500">ID: {patient.id} • Last visit: {formatDate(patient.lastVisit)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-6">
                <div className="h-24 w-24 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-3xl shadow-inner">
                  {patient.name[0]}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-slate-400">Age</p>
                  <p className="font-medium text-slate-900">{patient.age} Years</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-slate-400">Gender</p>
                  <p className="font-medium text-slate-900">{patient.gender}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-slate-400">Phone</p>
                  <p className="font-medium text-slate-900">{patient.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-slate-400">Email</p>
                  <p className="font-medium text-slate-900 truncate">{patient.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-slate-400">Blood Group</p>
                  <p className="font-medium text-slate-900">{patient.bloodGroup || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-slate-400">Condition</p>
                  <p className="font-medium text-slate-900 truncate">{patient.condition}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setIsEditModalOpen(true)}>Edit Profile</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vitals Overview</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsVitalModalOpen(true)}>
                <Plus size={16} />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: 'Heart Rate', type: 'Heart Rate', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
                { label: 'Blood Pressure', type: 'Blood Pressure', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Temperature', type: 'Temperature', icon: Thermometer, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'Oxygen Level', type: 'Oxygen Level', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
              ].map((vital) => {
                const data = latestVitals[vital.type as keyof typeof latestVitals];
                return (
                  <div key={vital.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('rounded-lg p-2', vital.bg)}>
                        <vital.icon className={vital.color} size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-600">{vital.label}</span>
                        {data && <span className="text-[10px] text-slate-400">{formatRelativeTime(data.timestamp)}</span>}
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">
                      {data ? `${data.value} ${data.unit}` : '--'}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Medical History</CardTitle>
                <CardDescription>Recent diagnoses and treatments</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsHistoryModalOpen(true)}>
                <Plus size={16} />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {patientHistory.length > 0 ? (
                  patientHistory.map((item, i) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                        {i !== patientHistory.length - 1 && <div className="h-full w-px bg-slate-200" />}
                      </div>
                      <div className="pb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase">{formatDate(item.date)}</p>
                        <h4 className="mt-1 font-bold text-slate-900">{item.title}</h4>
                        <p className="text-sm text-slate-500">Conducted by {item.doctor}</p>
                        <Badge variant="info" className="mt-2">{item.status}</Badge>
                        {item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-slate-400 italic">No medical history recorded yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Clinical Notes</CardTitle>
                <CardDescription>Latest observations and recommendations</CardDescription>
              </div>
              <Button size="sm" className="gap-2" onClick={() => setIsNoteModalOpen(true)}>
                <FileText size={16} />
                Add Note
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {patientNotes.length > 0 ? (
                patientNotes.map((note) => (
                  <div key={note.id} className="rounded-2xl bg-slate-50 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                        <Stethoscope size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{note.doctor}</p>
                        <p className="text-xs text-slate-500">{formatDate(note.date)} • {formatRelativeTime(note.timestamp)}</p>
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <p className="text-slate-400 italic">No clinical notes recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsEditModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Edit Patient Profile</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100 text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdatePatient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Full Name" 
                    required 
                    value={editData.name}
                    onChange={e => setEditData({...editData, name: e.target.value})}
                  />
                  <Input 
                    label="Age" 
                    type="number"
                    required 
                    value={editData.age}
                    onChange={e => setEditData({...editData, age: parseInt(e.target.value)})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Gender</label>
                    <select 
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20"
                      value={editData.gender}
                      onChange={e => setEditData({...editData, gender: e.target.value as any})}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Status</label>
                    <select 
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20"
                      value={editData.status}
                      onChange={e => setEditData({...editData, status: e.target.value as any})}
                    >
                      <option value="Stable">Stable</option>
                      <option value="Critical">Critical</option>
                      <option value="Recovering">Recovering</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Phone" 
                    required 
                    value={editData.phone}
                    onChange={e => setEditData({...editData, phone: e.target.value})}
                  />
                  <Input 
                    label="Email" 
                    type="email"
                    required 
                    value={editData.email}
                    onChange={e => setEditData({...editData, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Blood Group" 
                    value={editData.bloodGroup}
                    onChange={e => setEditData({...editData, bloodGroup: e.target.value})}
                  />
                  <Input 
                    label="Condition" 
                    required 
                    value={editData.condition}
                    onChange={e => setEditData({...editData, condition: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Address</label>
                  <textarea 
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20"
                    rows={3}
                    value={editData.address}
                    onChange={e => setEditData({...editData, address: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">Update Profile</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Medical History Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsHistoryModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Add Medical History</h2>
                <button onClick={() => setIsHistoryModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100 text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddHistory} className="space-y-4">
                <Input 
                  label="Title" 
                  required 
                  value={newHistory.title}
                  onChange={e => setNewHistory({...newHistory, title: e.target.value})}
                  placeholder="e.g. Hypertension Follow-up"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Date" 
                    type="date"
                    required 
                    value={newHistory.date}
                    onChange={e => setNewHistory({...newHistory, date: e.target.value})}
                  />
                  <Input 
                    label="Doctor" 
                    required 
                    value={newHistory.doctor}
                    onChange={e => setNewHistory({...newHistory, doctor: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <select 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20"
                    value={newHistory.status}
                    onChange={e => setNewHistory({...newHistory, status: e.target.value})}
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Reviewed">Reviewed</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Description (Optional)</label>
                  <textarea 
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20"
                    rows={3}
                    value={newHistory.description}
                    onChange={e => setNewHistory({...newHistory, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsHistoryModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">Add Record</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Clinical Note Modal */}
      <AnimatePresence>
        {isNoteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsNoteModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Add Clinical Note</h2>
                <button onClick={() => setIsNoteModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100 text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddNote} className="space-y-4">
                <Input 
                  label="Doctor Name" 
                  required 
                  value={newNote.doctor}
                  onChange={e => setNewNote({...newNote, doctor: e.target.value})}
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Note Content</label>
                  <textarea 
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20"
                    rows={6}
                    required
                    value={newNote.content}
                    onChange={e => setNewNote({...newNote, content: e.target.value})}
                    placeholder="Enter observations, recommendations, etc."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsNoteModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">Save Note</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isVitalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsVitalModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Record New Vital</h2>
                <button onClick={() => setIsVitalModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100 text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddVital} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Vital Type</label>
                  <select 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20"
                    value={newVital.type}
                    onChange={e => {
                      const type = e.target.value as Vital['type'];
                      let unit = 'bpm';
                      if (type === 'Blood Pressure') unit = 'mmHg';
                      if (type === 'Temperature') unit = '°F';
                      if (type === 'Oxygen Level') unit = '%';
                      setNewVital({ ...newVital, type, unit });
                    }}
                  >
                    <option value="Heart Rate">Heart Rate</option>
                    <option value="Blood Pressure">Blood Pressure</option>
                    <option value="Temperature">Temperature</option>
                    <option value="Oxygen Level">Oxygen Level</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Value" 
                    required 
                    value={newVital.value}
                    onChange={e => setNewVital({...newVital, value: e.target.value})}
                    placeholder={newVital.type === 'Blood Pressure' ? '120/80' : '72'}
                  />
                  <Input 
                    label="Unit" 
                    required 
                    value={newVital.unit}
                    onChange={e => setNewVital({...newVital, unit: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsVitalModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">Save Vital</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

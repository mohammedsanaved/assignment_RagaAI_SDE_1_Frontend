import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePatientStore } from '@/src/app/store/patientStore';
import { useAuthStore } from '@/src/app/store/authStore';
import { useNotification } from '@/src/hooks/useNotification';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Input } from '@/src/components/ui/Input';
import {
  LayoutGrid,
  List,
  Search,
  Filter as FilterIcon,
  MoreVertical,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  Plus,
  X,
  Edit2,
  Trash2,
  Eye,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '@/src/utils/date';
import { patientSchema } from '@/src/types/schemas';
import { z } from 'zod';
import { cn } from '@/src/utils/cn';

export default function Patients() {
  const navigate = useNavigate();
  const {
    patients,
    viewMode,
    toggleViewMode,
    addPatient,
    updatePatient,
    deletePatient,
    isLoading,
    error: storeError,
    clearError,
  } = usePatientStore();
  const { user } = useAuthStore();
  const { sendNotification } = useNotification();

  useEffect(() => {
    if (storeError) {
      sendNotification('Error', {
        body: storeError,
        icon: '/favicon.ico',
      });
      // Clear error after showing notification
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [storeError, sendNotification, clearError]);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(
    null,
  );

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [genderFilters, setGenderFilters] = useState<string[]>([]);

  // Row action state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: 'Male' as const,
    status: 'Stable' as const,
    condition: '',
    email: '',
    phone: '',
  });

  // Handle outside clicks for menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.condition.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilters.length === 0 || statusFilters.includes(p.status);
      const matchesGender =
        genderFilters.length === 0 || genderFilters.includes(p.gender);

      return matchesSearch && matchesStatus && matchesGender;
    });
  }, [patients, search, statusFilters, genderFilters]);

  const activeFilterCount = statusFilters.length + genderFilters.length;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Stable':
        return 'success';
      case 'Critical':
        return 'error';
      case 'Recovering':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setFormErrors({});

    const result = patientSchema.safeParse({
      ...newPatient,
      age: parseInt(newPatient.age) || 0,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    if (editingPatient) {
      await updatePatient(editingPatient.id, result.data);
      sendNotification('Patient Updated', {
        body: `Patient ${result.data.name} record has been updated.`,
        icon: '/favicon.ico',
      });
    } else {
      await addPatient({
        ...result.data,
        createdBy: user.uid,
      });

      sendNotification('New Patient Added', {
        body: `Patient ${result.data.name} has been added to the system.`,
        icon: '/favicon.ico',
      });
    }

    setIsModalOpen(false);
    setEditingPatient(null);
    setNewPatient({
      name: '',
      age: '',
      gender: 'Male',
      status: 'Stable',
      condition: '',
      email: '',
      phone: '',
    });
  };

  const handleEdit = (patient: any) => {
    setEditingPatient(patient);
    setNewPatient({
      name: patient.name,
      age: patient.age.toString(),
      gender: patient.gender,
      status: patient.status,
      condition: patient.condition,
      email: patient.email || '',
      phone: patient.phone || '',
    });
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDelete = async (id: string) => {
    await deletePatient(id);
    setDeletingPatientId(null);
    sendNotification('Patient Deleted', {
      body: 'Patient record has been removed from the system.',
      icon: '/favicon.ico',
    });
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const toggleGenderFilter = (gender: string) => {
    setGenderFilters((prev) =>
      prev.includes(gender)
        ? prev.filter((g) => g !== gender)
        : [...prev, gender],
    );
  };

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-slate-900'>
            Patient Management
          </h1>
          <p className='text-slate-500'>
            Manage and monitor patient records efficiently.
          </p>
        </div>
        <div className='flex items-center gap-2 rounded-xl bg-white p-1 shadow-sm border border-slate-200'>
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size='sm'
            onClick={() => viewMode !== 'grid' && toggleViewMode()}
            className='rounded-lg'
          >
            <LayoutGrid size={18} />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size='sm'
            onClick={() => viewMode !== 'list' && toggleViewMode()}
            className='rounded-lg'
          >
            <List size={18} />
          </Button>
        </div>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='relative flex-1 max-w-md'>
          <Search
            className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
            size={18}
          />
          <input
            type='text'
            placeholder='Search by name or condition...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/20'
          />
        </div>
        <div className='flex gap-2 relative'>
          <div className='relative'>
            <Button
              variant={activeFilterCount > 0 ? 'primary' : 'outline'}
              className='gap-2'
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <FilterIcon size={18} />
              Filter
              {activeFilterCount > 0 && (
                <span className='ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-emerald-600'>
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <AnimatePresence>
              {isFilterOpen && (
                <>
                  <div
                    className='fixed inset-0 z-10'
                    onClick={() => setIsFilterOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className='absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl'
                  >
                    <div className='space-y-4'>
                      <div>
                        <p className='mb-2 text-xs font-bold uppercase tracking-wider text-slate-400'>
                          Status
                        </p>
                        <div className='space-y-2'>
                          {['Stable', 'Recovering', 'Critical'].map(
                            (status) => (
                              <label
                                key={status}
                                className='flex items-center gap-2 cursor-pointer group'
                              >
                                <div
                                  className={cn(
                                    'flex h-5 w-5 items-center justify-center rounded-md border transition-colors',
                                    statusFilters.includes(status)
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-200 group-hover:border-emerald-500',
                                  )}
                                  onClick={() => toggleStatusFilter(status)}
                                >
                                  {statusFilters.includes(status) && (
                                    <Check size={12} strokeWidth={3} />
                                  )}
                                </div>
                                <span className='text-sm text-slate-600'>
                                  {status}
                                </span>
                              </label>
                            ),
                          )}
                        </div>
                      </div>
                      <div className='h-px bg-slate-100' />
                      <div>
                        <p className='mb-2 text-xs font-bold uppercase tracking-wider text-slate-400'>
                          Gender
                        </p>
                        <div className='space-y-2'>
                          {['Male', 'Female', 'Other'].map((gender) => (
                            <label
                              key={gender}
                              className='flex items-center gap-2 cursor-pointer group'
                            >
                              <div
                                className={cn(
                                  'flex h-5 w-5 items-center justify-center rounded-md border transition-colors',
                                  genderFilters.includes(gender)
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-200 group-hover:border-emerald-500',
                                )}
                                onClick={() => toggleGenderFilter(gender)}
                              >
                                {genderFilters.includes(gender) && (
                                  <Check size={12} strokeWidth={3} />
                                )}
                              </div>
                              <span className='text-sm text-slate-600'>
                                {gender}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {(statusFilters.length > 0 ||
                        genderFilters.length > 0) && (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='w-full text-xs text-slate-400 hover:text-rose-600'
                          onClick={() => {
                            setStatusFilters([]);
                            setGenderFilters([]);
                          }}
                        >
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <Button
            className='gap-2'
            onClick={() => {
              setEditingPatient(null);
              setNewPatient({
                name: '',
                age: '',
                gender: 'Male',
                status: 'Stable',
                condition: '',
                email: '',
                phone: '',
              });
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} />
            Add Patient
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className='flex h-64 items-center justify-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent' />
        </div>
      ) : (
        <>
          <AnimatePresence mode='wait'>
            {viewMode === 'grid' ? (
              <motion.div
                key='grid'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              >
                {filteredPatients.map((patient) => (
                  <Card key={patient.id} className='group overflow-hidden'>
                    <CardContent className='p-0'>
                      <div className='p-6'>
                        <div className='flex items-start justify-between'>
                          <div className='h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg'>
                            {patient.name[0]}
                          </div>
                          <Badge variant={getStatusVariant(patient.status)}>
                            {patient.status}
                          </Badge>
                        </div>
                        <div className='mt-4'>
                          <h3 className='font-bold text-slate-900 group-hover:text-emerald-600 transition-colors'>
                            {patient.name}
                          </h3>
                          <p className='text-sm text-slate-500'>
                            {patient.condition}
                          </p>
                        </div>
                        <div className='mt-6 space-y-3'>
                          <div className='flex items-center gap-2 text-xs text-slate-500'>
                            <Phone size={14} className='text-slate-400' />
                            {patient.phone}
                          </div>
                          <div className='flex items-center gap-2 text-xs text-slate-500'>
                            <Mail size={14} className='text-slate-400' />
                            {patient.email}
                          </div>
                          <div className='flex items-center gap-2 text-xs text-slate-500'>
                            <Calendar size={14} className='text-slate-400' />
                            Last visit: {formatDate(patient.lastVisit)}
                          </div>
                        </div>
                      </div>
                      <div className='border-t border-slate-100 bg-slate-50 p-3 flex justify-between items-center'>
                        <span className='text-xs font-medium text-slate-500'>
                          Age: {patient.age}
                        </span>
                        <Link to={`/patients/${patient.id}`}>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 text-emerald-600'
                          >
                            Details <ChevronRight size={14} />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key='list'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='rounded-2xl border border-slate-200 bg-white overflow-y-scroll shadow-sm'
              >
                <table className='w-full text-left text-sm'>
                  <thead className='bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500'>
                    <tr>
                      <th className='px-6 py-4'>Patient</th>
                      <th className='px-6 py-4'>Status</th>
                      <th className='px-6 py-4'>Condition</th>
                      <th className='px-6 py-4'>Age/Gender</th>
                      <th className='px-6 py-4'>Last Visit</th>
                      <th className='px-6 py-4'></th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100'>
                    {filteredPatients.map((patient) => (
                      <tr
                        key={patient.id}
                        className='hover:bg-slate-50 transition-colors group'
                      >
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-3'>
                            <div className='h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs'>
                              {patient.name[0]}
                            </div>
                            <div>
                              <p className='font-semibold text-slate-900'>
                                {patient.name}
                              </p>
                              <p className='text-xs text-slate-500'>
                                {patient.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <Badge variant={getStatusVariant(patient.status)}>
                            {patient.status}
                          </Badge>
                        </td>
                        <td className='px-6 py-4 text-slate-600'>
                          {patient.condition}
                        </td>
                        <td className='px-6 py-4 text-slate-600'>
                          {patient.age} / {patient.gender}
                        </td>
                        <td className='px-6 py-4 text-slate-600'>
                          {formatDate(patient.lastVisit)}
                        </td>
                        <td className='px-6 py-4 text-right relative'>
                          <button
                            className='text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors'
                            onClick={() =>
                              setActiveMenuId(
                                activeMenuId === patient.id ? null : patient.id,
                              )
                            }
                          >
                            <MoreVertical size={18} />
                          </button>

                          <AnimatePresence>
                            {activeMenuId === patient.id && (
                              <motion.div
                                ref={menuRef}
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className='absolute right-6 top-12 z-20 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl'
                              >
                                <button
                                  className='flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors'
                                  onClick={() =>
                                    navigate(`/patients/${patient.id}`)
                                  }
                                >
                                  <Eye size={16} />
                                  View Details
                                </button>
                                <button
                                  className='flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors'
                                  onClick={() => handleEdit(patient)}
                                >
                                  <Edit2 size={16} />
                                  Edit Record
                                </button>
                                <div className='my-1 h-px bg-slate-100' />
                                <button
                                  className='flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors'
                                  onClick={() => {
                                    setDeletingPatientId(patient.id);
                                    setActiveMenuId(null);
                                  }}
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>

          {usePatientStore.getState().hasMore && (
            <div className='mt-8 flex justify-center'>
              <Button
                variant='outline'
                onClick={() => usePatientStore.getState().loadMore()}
                isLoading={isLoading}
              >
                Load More Patients
              </Button>
            </div>
          )}
        </>
      )}

      {/* Add Patient Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='absolute inset-0 bg-slate-900/40 backdrop-blur-sm'
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className='relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl'
            >
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-bold text-slate-900'>
                  {editingPatient ? 'Edit Patient Record' : 'Add New Patient'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className='rounded-full p-2 hover:bg-slate-100 text-slate-400'
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddPatient} className='space-y-4'>
                <Input
                  label='Full Name'
                  required
                  value={newPatient.name}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, name: e.target.value })
                  }
                  error={formErrors.name}
                />
                <div className='grid grid-cols-2 gap-4'>
                  <Input
                    label='Age'
                    type='number'
                    required
                    value={newPatient.age}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, age: e.target.value })
                    }
                    error={formErrors.age}
                  />
                  <div className='space-y-1.5'>
                    <label className='text-sm font-medium text-slate-700'>
                      Gender
                    </label>
                    <select
                      className={cn(
                        'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20',
                        formErrors.gender &&
                          'border-rose-500 focus:ring-rose-500/20',
                      )}
                      value={newPatient.gender}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          gender: e.target.value as any,
                        })
                      }
                    >
                      <option value='Male'>Male</option>
                      <option value='Female'>Female</option>
                      <option value='Other'>Other</option>
                    </select>
                    {formErrors.gender && (
                      <p className='text-xs font-medium text-rose-500'>
                        {formErrors.gender}
                      </p>
                    )}
                  </div>
                </div>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-slate-700'>
                    Status
                  </label>
                  <select
                    className={cn(
                      'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20',
                      formErrors.status &&
                        'border-rose-500 focus:ring-rose-500/20',
                    )}
                    value={newPatient.status}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        status: e.target.value as any,
                      })
                    }
                  >
                    <option value='Stable'>Stable</option>
                    <option value='Recovering'>Recovering</option>
                    <option value='Critical'>Critical</option>
                  </select>
                  {formErrors.status && (
                    <p className='text-xs font-medium text-rose-500'>
                      {formErrors.status}
                    </p>
                  )}
                </div>
                <Input
                  label='Condition'
                  required
                  value={newPatient.condition}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, condition: e.target.value })
                  }
                  error={formErrors.condition}
                />
                <div className='grid grid-cols-2 gap-4'>
                  <Input
                    label='Email'
                    type='email'
                    value={newPatient.email}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, email: e.target.value })
                    }
                    error={formErrors.email}
                  />
                  <Input
                    label='Phone'
                    value={newPatient.phone}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, phone: e.target.value })
                    }
                    error={formErrors.phone}
                  />
                </div>
                <div className='flex gap-3 pt-4'>
                  <Button
                    variant='outline'
                    className='flex-1'
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' className='flex-1'>
                    {editingPatient ? 'Save Changes' : 'Create Record'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deletingPatientId && (
          <div className='fixed inset-0 z-[60] flex items-center justify-center p-4'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='absolute inset-0 bg-slate-900/40 backdrop-blur-sm'
              onClick={() => setDeletingPatientId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl text-center'
            >
              <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600'>
                <Trash2 size={24} />
              </div>
              <h3 className='mb-2 text-lg font-bold text-slate-900'>
                Delete Patient?
              </h3>
              <p className='mb-6 text-sm text-slate-500'>
                This action cannot be undone. All patient records and history
                will be permanently removed.
              </p>
              <div className='flex gap-3'>
                <Button
                  variant='outline'
                  className='flex-1'
                  onClick={() => setDeletingPatientId(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant='primary'
                  className='flex-1 bg-rose-600 hover:bg-rose-700 border-rose-600'
                  onClick={() => handleDelete(deletingPatientId)}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Select, useToast } from '@chakra-ui/react';
import supabase from '@/lib/supabaseClient';
import { useRouter } from 'next/router';

interface RoleOption {
  id: string;
  name: string;
}

export const RoleSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selected, setSelected] = useState<string>('');
  const toast = useToast();
  const router = useRouter();

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  useEffect(() => {
    const fetchRoles = async () => {
      const { data, error } = await supabase.from('roles').select('id, name');
      if (error) {
        console.error('Failed to fetch roles', error);
        return;
      }
      setRoles(data as RoleOption[]);
    };
    fetchRoles();
  }, []);

  const handleSave = () => {
    if (!selected) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_role_id', selected);
    }
    toast({ title: 'Role berhasil diganti', status: 'success', duration: 2000 });
    // Redirect to dashboard after role change with full reload
    window.location.href = '/admin/dashboard';
  };
  return (
    <>
      <Button onClick={open} variant="ghost" size="sm">
        Ganti Role
      </Button>
      <Modal isOpen={isOpen} onClose={close} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ganti Role</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Select placeholder="Pilih role" value={selected} onChange={e => setSelected(e.target.value)}>
              {roles.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button onClick={close} mr={3}>
              Batal
            </Button>
            <Button colorScheme="blue" onClick={handleSave} isDisabled={!selected}>
              Simpan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

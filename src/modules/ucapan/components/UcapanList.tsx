import { useEffect, useState } from 'react';
import { Box, VStack, Text, Spinner, Center, useColorMode } from '@chakra-ui/react';
import UcapanAPI from '@/modules/admin/ucapan/services/UcapanAPI';
import { UcapanWithReplies } from '@/modules/admin/ucapan/types/Ucapan.types';
import UcapanItem from './UcapanItem';

interface UcapanListProps {
  refreshTrigger?: number;
  isAdminMode?: boolean;
  adminUserId?: string | null;
  guestId?: string | null;
  guestName?: string | null;
}

const UcapanList: React.FC<UcapanListProps> = ({ 
  refreshTrigger = 0, 
  isAdminMode = false,
  adminUserId = null,
  guestId = null,
  guestName = null
}) => {
  const [ucapanList, setUcapanList] = useState<UcapanWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const { colorMode } = useColorMode();
  const api = new UcapanAPI();

  const fetchUcapan = async () => {
    try {
      console.log('Starting to fetch ucapan...');
      setLoading(true);
      const data = await api.getPublicUcapan();
      console.log('Fetched ucapan data:', data);
      console.log('Number of parent ucapan:', data.length);
      data.forEach((parent, index) => {
        console.log(`Parent ${index + 1}:`, parent.id, 'has', parent.replies?.length || 0, 'replies');
        if (parent.replies && parent.replies.length > 0) {
          parent.replies.forEach((reply, rIndex) => {
            console.log(`  Reply ${rIndex + 1}:`, reply.id, 'parent_id:', reply.parent_id);
          });
        }
      });
      setUcapanList(data);
    } catch (error) {
      console.error('Error fetching ucapan:', error);
    } finally {
      setLoading(false);
      console.log('Fetch ucapan completed');
    }
  };

  useEffect(() => {
    fetchUcapan();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <Center py={10}>
        <Spinner size="lg" color="teal.500" />
      </Center>
    );
  }

  if (ucapanList.length === 0) {
    return (
      <Center py={10}>
        <Text color="gray.500">Belum ada ucapan. Jadilah yang pertama!</Text>
      </Center>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {ucapanList.map((ucapan) => {
        // Determine if this is the last message in the thread
        const hasReplies = ucapan.replies && ucapan.replies.length > 0;
        const isParentLast = !hasReplies;
        
        return (
          <Box key={ucapan.id}>
            <UcapanItem 
              ucapan={ucapan} 
              isAdminMode={isAdminMode}
              adminUserId={adminUserId}
              guestId={guestId}
              guestName={guestName}
              isLastInThread={isParentLast}
              onReplySuccess={fetchUcapan}
            />
            {hasReplies && (
              <VStack spacing={2} align="stretch" mt={2}>
                {ucapan.replies!.map((reply, index) => {
                  const isLastReply = index === ucapan.replies!.length - 1;
                  return (
                    <UcapanItem 
                      key={reply.id} 
                      ucapan={reply} 
                      isReply 
                      isAdminMode={isAdminMode}
                      adminUserId={adminUserId}
                      guestId={guestId}
                      guestName={guestName}
                      isLastInThread={isLastReply}
                      onReplySuccess={fetchUcapan}
                    />
                  );
                })}
              </VStack>
            )}
          </Box>
        );
      })}
    </VStack>
  );
};

export default UcapanList;

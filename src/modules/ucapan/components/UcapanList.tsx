import { useEffect, useState } from 'react';
import { Box, VStack, Text, Spinner, Center, useColorMode, Flex, Button } from '@chakra-ui/react';
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
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const { colorMode } = useColorMode();
  const api = new UcapanAPI();

  const INITIAL_REPLIES_SHOW = 2;

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

  const toggleExpandThread = (threadId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  return (
    <VStack spacing={4} align="stretch">
      {ucapanList.map((ucapan) => {
        // Determine if this is the last message in the thread
        const hasReplies = ucapan.replies && ucapan.replies.length > 0;
        const isParentLast = !hasReplies;
        const isExpanded = expandedThreads.has(ucapan.id);
        const repliesToShow = isExpanded 
          ? ucapan.replies 
          : ucapan.replies?.slice(0, INITIAL_REPLIES_SHOW);
        const hasMoreReplies = ucapan.replies && ucapan.replies.length > INITIAL_REPLIES_SHOW;
        
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
                {repliesToShow!.map((reply, index) => {
                  const isLastReply = index === repliesToShow!.length - 1;
                  return (
                    <UcapanItem 
                      key={reply.id} 
                      ucapan={reply} 
                      isReply 
                      isAdminMode={isAdminMode}
                      adminUserId={adminUserId}
                      guestId={guestId}
                      guestName={guestName}
                      isLastInThread={isLastReply && isExpanded}
                      onReplySuccess={fetchUcapan}
                    />
                  );
                })}
                
                {/* Load More Button */}
                {hasMoreReplies && !isExpanded && (
                  <Flex justify="center" mt={2} ml={8}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleExpandThread(ucapan.id)}
                      fontSize="xs"
                      fontWeight="600"
                      color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                      _hover={{
                        color: colorMode === 'light' ? 'black' : 'white',
                        bg: 'transparent',
                      }}
                    >
                      Lihat {ucapan.replies!.length - INITIAL_REPLIES_SHOW} balasan lainnya
                    </Button>
                  </Flex>
                )}
                
                {/* Show Less Button */}
                {hasMoreReplies && isExpanded && (
                  <Flex justify="center" mt={2} ml={8}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleExpandThread(ucapan.id)}
                      fontSize="xs"
                      fontWeight="600"
                      color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                      _hover={{
                        color: colorMode === 'light' ? 'black' : 'white',
                        bg: 'transparent',
                      }}
                    >
                      Sembunyikan balasan
                    </Button>
                  </Flex>
                )}
              </VStack>
            )}
          </Box>
        );
      })}
    </VStack>
  );
};

export default UcapanList;

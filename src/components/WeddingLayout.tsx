import { ReactNode } from 'react';
import { Box, Flex, Container } from '@chakra-ui/react';
import Sidebar from './organisms/Sidebar';

interface WeddingLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

const WeddingLayout = ({ children, pageTitle }: WeddingLayoutProps) => {
  return (
    <Flex minH="100vh" bg="gray.50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <Box 
        flex="1" 
        ml={{ base: "0", m: "108px", d: "280px" }} // Adjust margin based on sidebar state
        transition="margin-left 0.3s ease"
        minH="100vh"
      >
        <Container 
          maxW="container.xl" 
          py={8} 
          px={{ base: 4, md: 6 }}
        >
          <Box 
            bg="white" 
            borderRadius="2xl" 
            boxShadow="lg" 
            p={{ base: 4, md: 8 }} 
            mb={6}
          >
            {pageTitle && (
              <Box mb={6}>
                <h1 style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: 'gray.800',
                  marginBottom: '0.5rem'
                }}>
                  {pageTitle}
                </h1>
              </Box>
            )}
            {children}
          </Box>
        </Container>
      </Box>
    </Flex>
  );
};

export default WeddingLayout;
import React, { useEffect, useState } from 'react';
import { IconButton, Tooltip, useColorMode } from '@chakra-ui/react';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import { 
  enterFullscreen, 
  exitFullscreen, 
  isFullscreenActive, 
  isMobileOrTablet,
  isFullscreenSupported 
} from '@/utils/fullscreen';

export const FullscreenButton: React.FC = () => {
  const { colorMode } = useColorMode();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Check if should show button
  useEffect(() => {
    const shouldShow = isMobileOrTablet() && isFullscreenSupported();
    setIsVisible(shouldShow);
    
    if (shouldShow) {
      setIsFullscreen(isFullscreenActive());
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    if (!isVisible) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(isFullscreenActive());
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isVisible]);

  const handleToggle = async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  };

  if (!isVisible) return null;

  return (
    <Tooltip 
      label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'} 
      placement="left"
      hasArrow
    >
      <IconButton
        aria-label="Toggle fullscreen"
        icon={
          <MaterialIcon 
            name={isFullscreen ? 'fullscreen_exit' : 'fullscreen'} 
            size={24} 
          />
        }
        onClick={handleToggle}
        position="fixed"
        bottom={{ base: '80px', xl: '20px' }} // Above bottom nav on mobile
        right="20px"
        zIndex={999}
        size="lg"
        borderRadius="full"
        bg={colorMode === 'light' ? 'white' : 'gray.700'}
        color={colorMode === 'light' ? 'gray.900' : 'white'}
        boxShadow="lg"
        _hover={{
          bg: colorMode === 'light' ? 'gray.100' : 'gray.600',
          transform: 'scale(1.05)',
        }}
        _active={{
          transform: 'scale(0.95)',
        }}
        transition="all 0.2s"
      />
    </Tooltip>
  );
};

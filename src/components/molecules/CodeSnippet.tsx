import React, { useState } from 'react';
import { Box, Button, Flex, Text, useClipboard, useColorMode } from '@chakra-ui/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { FiCopy, FiCheck } from 'react-icons/fi';

interface CodeSnippetProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  title?: string;
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({
  code,
  language = 'tsx',
  showLineNumbers = true,
  title,
}) => {
  const { colorMode } = useColorMode();
  const { hasCopied, onCopy } = useClipboard(code);

  const style = colorMode === 'dark' ? tomorrow : oneLight;

  return (
    <Box
      position="relative"
      borderRadius="md"
      overflow="hidden"
      border="1px solid"
      borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
      mb={4}
    >
      {title && (
        <Flex
          px={4}
          py={2}
          bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'}
          borderBottom="1px solid"
          borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
          justifyContent="space-between"
          alignItems="center"
        >
          <Text fontSize="sm" fontWeight="medium">
            {title}
          </Text>
        </Flex>
      )}
      <Box position="relative">
        <Button
          position="absolute"
          top={2}
          right={2}
          size="sm"
          zIndex={1}
          colorScheme={hasCopied ? 'green' : 'gray'}
          leftIcon={hasCopied ? <FiCheck /> : <FiCopy />}
          onClick={onCopy}
        >
          {hasCopied ? 'Copied!' : 'Copy'}
        </Button>
        <Box fontSize="14px" fontFamily="monospace">
          <SyntaxHighlighter
            language={language}
            style={style}
            showLineNumbers={showLineNumbers}
            customStyle={{
              margin: 0,
              padding: '16px',
              borderRadius: 0,
              fontSize: '14px',
            }}
          >
            {code}
          </SyntaxHighlighter>
        </Box>
      </Box>
    </Box>
  );
};

export default CodeSnippet; 
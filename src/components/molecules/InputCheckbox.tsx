import React, { ReactNode, useContext } from "react";
import {
  Box,
  useCheckbox,
  UseCheckboxProps,
  Flex,
  Center,
  useColorMode,
} from "@chakra-ui/react";
import { CheckmarkSolidIconMade } from "../atoms/IconsMade";
import AppSettingContext from "@/providers/AppSettingProvider";

interface InputCheckboxProps extends UseCheckboxProps {
  children: ReactNode;
  isDisabled?: boolean;
  alignMark?: "start" | "center" | "end";
  isReverse?: boolean;
  isCard?: boolean;
}

const InputCheckbox: React.FC<InputCheckboxProps> = ({
  alignMark = "center",
  children,
  isReverse,
  isCard,
  ...props
}) => {
  const { getInputProps, getCheckboxProps, getLabelProps, state } =
    useCheckbox(props);
  const input = getInputProps();
  const checkbox = getCheckboxProps();
  const label = getLabelProps();
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);

  return (
    <Box as="label" {...label} w={isCard ? "full" : "auto"} pos="relative">
      <input {...input} />
      <Flex
        {...checkbox}
        alignItems={alignMark}
        flexDir={isReverse ? "row-reverse" : "unset"}
        gap={3}
        p={isCard ? "16px" : "unset"}
        opacity={props.isDisabled ? "0.4" : "1"}
        cursor={props.isDisabled ? "not-allowed" : "pointer"}
        transition="all .25s"
        bg={
          isCard
            ? state.isChecked
              ? colorMode === "light"
                ? `${colorPref}.50`
                : `${colorPref}Dim.800`
              : "transparent"
            : "transparent"
        }
        borderWidth={isCard ? "2px" : "unset"}
        borderStyle={isCard ? "solid" : "unset"}
        borderColor={
          isCard
            ? props.isInvalid
              ? colorMode === "light"
                ? "red.500"
                : "redDim.500"
              : state.isChecked
              ? colorMode === "light"
                ? `${colorPref}.500`
                : `${colorPref}Dim.500`
              : colorMode === "light"
              ? "gray.100"
              : "gray.800"
            : "transparent"
        }
        borderRadius={isCard ? "16px" : "unset"}
      >
        <Box w="20px" h="20px">
          <Center
            w="20px"
            h="20px"
            borderWidth="2px"
            borderStyle="solid"
            borderColor={
              props.isInvalid
                ? colorMode === "light"
                  ? "red.500"
                  : "redDim.500"
                : state.isChecked
                ? colorMode === "light"
                  ? `${colorPref}.500`
                  : `${colorPref}Dim.500`
                : colorMode === "light"
                ? "gray.100"
                : "gray.700"
            }
            borderRadius="8px"
            bg={
              state.isChecked
                ? colorMode === "light"
                  ? `${colorPref}.500`
                  : `${colorPref}Dim.500`
                : "transparent"
            }
            transition="all .25s"
          >
            <CheckmarkSolidIconMade
              fontSize="12px"
              color={state.isChecked ? "white" : "transparent"}
              transition="all .25s"
            />
          </Center>
        </Box>
        <Box fontSize="14px" fontWeight={500} w="full">
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

export default InputCheckbox;

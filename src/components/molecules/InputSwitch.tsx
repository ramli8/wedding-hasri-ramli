import React, { ReactNode, useContext, useEffect, useState } from "react";
import {
  Box,
  useCheckbox,
  UseCheckboxProps,
  Flex,
  useColorMode,
} from "@chakra-ui/react";
import AppSettingContext from "@/providers/AppSettingProvider";

interface InputSwitchProps extends UseCheckboxProps {
  children: ReactNode;
  isDisabled?: boolean;
  alignMark?: "start" | "center" | "end";
  isReverse?: boolean;
  isCard?: boolean;
}

const InputSwitch: React.FC<InputSwitchProps> = ({
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

  const [isChecked, setIsChecked] = useState(state.isChecked);

  useEffect(() => {
    setIsChecked(state.isChecked);
  }, [state.isChecked]);

  return (
    <Box as="label" {...label} w={isCard ? "full" : "auto"}>
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
            ? isChecked
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
              : isChecked
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
        <Box w="34px" h="22px" position="relative">
          <Box
            w="34px"
            h="22px"
            borderWidth="2px"
            borderStyle="solid"
            borderColor={
              props.isInvalid
                ? colorMode === "light"
                  ? "red.500"
                  : "redDim.500"
                : isChecked
                ? colorMode === "light"
                  ? `${colorPref}.500`
                  : `${colorPref}Dim.500`
                : colorMode === "light"
                ? "gray.100"
                : "gray.700"
            }
            borderRadius="full"
            bg={
              isChecked
                ? colorMode === "light"
                  ? `${colorPref}.500`
                  : `${colorPref}Dim.500`
                : "transparent"
            }
            transition="background-color .25s ease, border-color .25s ease"
          />
          <Box
            w="14px"
            h="14px"
            borderRadius="full"
            bg={
              isChecked
                ? "white"
                : colorMode === "light"
                ? "gray.200"
                : "gray.700"
            }
            position="absolute"
            top="50%"
            left={isChecked ? "calc(100% - 18px)" : "4px"}
            transform="translateY(-50%)"
            transition="background-color .25s ease, left .2s ease-in-out"
          />
        </Box>
        <Box fontSize="14px" fontWeight={500} w="full">
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

export default InputSwitch;

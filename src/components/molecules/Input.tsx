import AppSettingContext from "@/providers/AppSettingProvider";
import { Input, InputProps, useColorMode } from "@chakra-ui/react";
import React, { FC, useContext } from "react";

interface InputTextProps extends InputProps {
  isInvalid?: boolean;
  isRequired?: boolean;
}

const InputText: FC<InputTextProps> = ({ isInvalid, isRequired, ...props }) => {
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  return (
    <Input
      {...props}
      isRequired={isRequired}
      className="sorting__input"
      w="100%"
      h="56px"
      p="0px 20px 0 20px"
      border="2px solid"
      borderColor={
        isInvalid
          ? colorMode === "light"
            ? "red.500"
            : "redDim.500"
          : "transparent"
      }
      borderRadius="16px"
      bg={colorMode == "light" ? "rgba(228,228,228,0.3)" : "#292929"}
      fontSize="14px"
      fontWeight="600"
      color={colorMode == "light" ? "#1b1d21" : "#fff"}
      _placeholder={{
        color: colorMode === "light" ? "gray.500" : "gray.600",
        fontWeight: "500",
      }}
      placeholder={props.placeholder}
      _hover={{ borderColor: "transparent" }}
      _focusVisible={{
        borderColor:
          colorMode === "light" ? `${colorPref}.500` : `${colorPref}Dim.500`,
        background: colorMode == "light" ? "white" : "#222222",
      }}
      transition="all .25s"
    />
  );
};

export default InputText;

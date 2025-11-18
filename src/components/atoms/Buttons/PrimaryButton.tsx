import AppSettingContext from "@/providers/AppSettingProvider";
import { Button, ButtonProps, useColorMode } from "@chakra-ui/react";
import { ReactNode, useContext } from "react";

interface PrimaryButtonInterface extends ButtonProps {
  children: ReactNode;
  btnProps?: ButtonProps;
  w?: string;
  width?: string;
}

const PrimaryButton = ({
  children,
  w,
  width,
  ...btnProps
}: PrimaryButtonInterface) => {
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  return (
    <>
      <Button
        className="buttons"
        color="white"
        minW="166px"
        width={["100%", w ?? width ?? "unset"]}
        h="56px"
        p="0 20px"
        ml="12px"
        borderRadius="16px/16px"
        fontSize="14px"
        lineHeight="1.42857"
        fontWeight="700"
        transition="all .25s"
        bg={colorMode == "light" ? `${colorPref}.500` : `${colorPref}Dim.500`}
        _hover={{
          bg: colorMode == "light" ? `${colorPref}.600` : `${colorPref}Dim.600`,
        }}
        _first={{
          marginLeft: "0px",
        }}
        {...btnProps}
      >
        {children}
      </Button>
    </>
  );
};

const PrimarySubtleButton = ({
  children,
  w,
  width,
  ...btnProps
}: PrimaryButtonInterface) => {
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  return (
    <>
      <Button
        className="buttons"
        color={
          colorMode == "light" ? `${colorPref}.500` : `${colorPref}Dim.300`
        }
        minW="166px"
        width={["100%", w ?? width ?? "unset"]}
        h="56px"
        p="0 20px"
        ml="12px"
        borderRadius="16px/16px"
        fontSize="14px"
        lineHeight="1.42857"
        fontWeight="700"
        transition="all .25s"
        bg={colorMode == "light" ? `${colorPref}.50` : `${colorPref}Dim.700`}
        _hover={{
          background:
            colorMode == "light" ? `${colorPref}.100` : `${colorPref}Dim.800`,
        }}
        _first={{
          marginLeft: "0px",
        }}
        {...btnProps}
      >
        {children}
      </Button>
    </>
  );
};

const PrimaryOutlineButton = ({
  children,
  w,
  width,
  ...btnProps
}: PrimaryButtonInterface) => {
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  return (
    <>
      <Button
        className="buttons"
        color={
          colorMode == "light" ? `${colorPref}.500` : `${colorPref}Dim.300`
        }
        minW="166px"
        width={["100%", w ?? width ?? "unset"]}
        h="56px"
        p="0 20px"
        ml="12px"
        borderRadius="16px/16px"
        fontSize="14px"
        lineHeight="1.42857"
        fontWeight="700"
        transition="all .25s"
        bg="transparent"
        border="2px solid"
        borderColor={
          colorMode == "light" ? `${colorPref}.400` : `${colorPref}Dim.400`
        }
        _hover={{
          bg: colorMode == "light" ? `${colorPref}.50` : `${colorPref}Dim.700`,
        }}
        _first={{
          marginLeft: "0px",
        }}
        {...btnProps}
      >
        {children}
      </Button>
    </>
  );
};

const PrimaryGhostButton = ({
  children,
  w,
  width,
  ...btnProps
}: PrimaryButtonInterface) => {
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  return (
    <>
      <Button
        className="buttons"
        color={
          colorMode == "light" ? `${colorPref}.500` : `${colorPref}Dim.300`
        }
        minW="166px"
        width={["100%", w ?? width ?? "unset"]}
        h="56px"
        p="0 20px"
        ml="12px"
        borderRadius="16px/16px"
        fontSize="14px"
        lineHeight="1.42857"
        fontWeight="700"
        transition="all .25s"
        bg="transparent"
        _hover={{
          bg: colorMode == "light" ? `${colorPref}.50` : `${colorPref}Dim.700`,
        }}
        _first={{
          marginLeft: "0px",
        }}
        {...btnProps}
      >
        {children}
      </Button>
    </>
  );
};

export {
  PrimaryButton,
  PrimarySubtleButton,
  PrimaryOutlineButton,
  PrimaryGhostButton,
};

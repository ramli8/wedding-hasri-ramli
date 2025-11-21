import { Button, ButtonProps, useColorMode } from "@chakra-ui/react";
import { ReactNode } from "react";

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
  return (
    <>
      <Button
        className="buttons"
        color={colorMode === "light" ? "white" : "black"}
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
        bg={colorMode === "light" ? "black" : "white"}
        _hover={{
          bg: colorMode === "light" ? "gray.800" : "gray.200",
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
  return (
    <>
      <Button
        className="buttons"
        color={colorMode === "light" ? "black" : "white"}
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
        bg={colorMode === "light" ? "gray.100" : "gray.800"}
        _hover={{
          bg: colorMode === "light" ? "gray.200" : "gray.700",
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
  return (
    <>
      <Button
        className="buttons"
        color={colorMode === "light" ? "black" : "white"}
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
        borderColor={colorMode === "light" ? "black" : "white"}
        _hover={{
          bg: colorMode === "light" ? "gray.50" : "whiteAlpha.200",
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
  return (
    <>
      <Button
        className="buttons"
        color={colorMode === "light" ? "black" : "white"}
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
          bg: colorMode === "light" ? "gray.100" : "whiteAlpha.200",
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

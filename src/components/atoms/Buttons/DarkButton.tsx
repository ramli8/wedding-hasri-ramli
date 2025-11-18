import AppSettingContext from "@/providers/AppSettingProvider";
import { Button, ButtonProps, useColorMode } from "@chakra-ui/react";
import { ReactNode, useContext } from "react";

interface DarkButtonInterface extends ButtonProps {
  children: ReactNode;
  btnProps?: ButtonProps;
  w?: string;
  width?: string;
}

const DarkButton = ({
  children,
  w,
  width,
  ...btnProps
}: DarkButtonInterface) => {
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
        bg="gray.900"
        _hover={{
          bg: colorMode == "light" ? `${colorPref}.500` : `${colorPref}Dim.500`,
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

export { DarkButton };

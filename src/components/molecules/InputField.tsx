import AppSettingContext from "@/providers/AppSettingProvider";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { useField } from "formik";
import { useContext } from "react";
import "react-datepicker/dist/react-datepicker.css";

type InputProps = {
  label?: string;
  name: string;
  validate?: (value: any) => undefined | string | Promise<any>;
  type?: string;
  multiple?: boolean;
  // value?: string;
  req?: boolean;
  helpertext?: string;
  placeholder?: string;
  isDisabled?: boolean;
};

type InputPropsNew = {
  label?: string;
  name: string;
  validate?: (value: any) => undefined | string | Promise<any>;
  type?: string;
  multiple?: boolean;
  // value?: string;
  req?: boolean;
  helpertext?: string;
  placeholder?: string;
  isDisabled?: boolean;
  value?: any;
  onChange?: (value: any) => void;
};

const InputFormik = ({ ...props }: InputProps) => {
  const [field, meta, helpers] = useField(props);
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);

  return (
    <>
      <FormControl>
        <Box
          className="wizard__input_container"
          pos="relative"
          flexGrow="1"
          mb="16px"
        >
          <FormLabel
            fontSize="14px"
            fontWeight="500"
            mb="0px"
            pl="2px"
            display="flex"
            justifyContent="space-between"
            alignItems="end"
          >
            <Box>
              <Box>
                {props.label}{" "}
                <Box
                  display={props.req ? "unset" : "none"}
                  color={colorMode === "light" ? "red.500" : "redDim.500"}
                >
                  *
                </Box>
              </Box>
              <Text
                // pl="2px"
                color="#808080"
                fontSize="13px"
                display="block"
                mb="6px"
                mt="1px"
              >
                {props.helpertext}
              </Text>
            </Box>
          </FormLabel>

          <Input
            {...field}
            {...props}
            isDisabled={props.isDisabled}
            className="sorting__input"
            w="100%"
            h="56px"
            p="0px 20px 0 20px"
            borderWidth="2px"
            borderStyle="solid"
            borderRadius="16px"
            borderColor={meta.touched && meta.error ? "none" : "none"}
            bg={colorMode == "light" ? "rgba(228,228,228,0.3)" : "#292929"}
            fontSize="14px"
            fontWeight="600"
            color={colorMode == "light" ? "#1b1d21" : "#fff"}
            transition="all .25s"
            _placeholder={{
              color: "#bababa",
              fontWeight: "500",
            }}
            placeholder={props.placeholder}
            _hover={{
              borderColor:
                meta.touched && meta.error
                  ? colorMode === "light"
                    ? `red.500`
                    : `redDim.500`
                  : "transparent",
            }}
            sx={{
              borderColor:
                meta.touched && meta.error
                  ? colorMode === "light"
                    ? `red.500`
                    : `redDim.500`
                  : "transparent",
            }}
            _focusVisible={{
              borderColor:
                colorMode === "light"
                  ? `${colorPref}.500`
                  : `${colorPref}Dim.500`,
              background: colorMode == "light" ? "white" : "#222222",
            }}
          />

          <Text
            display={meta.touched && meta.error ? "block" : "none"}
            color={colorMode === "light" ? "red.500" : "redDim.500"}
            fontWeight="500"
            pt="6px"
            fontSize="14px"
          >
            {"\u00A0"}
            {meta.error}
          </Text>
        </Box>
      </FormControl>
    </>
  );
};

export const InputFormikNoLabel = ({ ...props }: InputProps) => {
  const [field, meta, helpers] = useField(props);
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);

  return (
    <>
      <FormControl>
        <Box
          className="wizard__input_container"
          pos="relative"
          flexGrow="1"
          mb="16px"
        >
          <FormLabel
            fontSize="14px"
            fontWeight="500"
            mb="0px"
            pl="2px"
            display="flex"
            justifyContent="space-between"
            alignItems="end"
          >
            {/* <Box>
              <Flex>
                {props.label}{" "}
                <Text display={props.req ? "unset" : "none"} color={colorMode === "light" ? "red.500" : "redDim.500"}>
                  {"\u00A0"}*
                </Text>
              </Flex>
              <Text
                // pl="2px"
                color="#808080"
                fontSize="13px"
                display="block"
                mb="6px"
                mt="1px"
              >
                {props.helpertext}
              </Text>
            </Box> */}

            {/* <Text
              display={meta.touched && meta.error ? "block" : "none"}
              color={colorMode === "light" ? "red.500" : "redDim.500"}
              fontWeight="500"
              pb="6px"
              fontSize="14px"
            >
              {"\u00A0"}
              {meta.error}
            </Text> */}
          </FormLabel>

          <Input
            {...field}
            {...props}
            isDisabled={props.isDisabled}
            className="sorting__input"
            w="100%"
            h="56px"
            p="0px 20px 0 20px"
            borderWidth="2px"
            borderStyle="solid"
            borderRadius="16px"
            borderColor={meta.touched && meta.error ? "none" : "none"}
            bg={colorMode == "light" ? "rgba(228,228,228,0.3)" : "#292929"}
            fontSize="14px"
            fontWeight="600"
            color={colorMode == "light" ? "#1b1d21" : "#fff"}
            _placeholder={{
              color: "#bababa",
              fontWeight: "500",
            }}
            placeholder={props.placeholder}
            _hover={{
              borderColor:
                meta.touched && meta.error
                  ? colorMode === "light"
                    ? `red.500`
                    : `redDim.500`
                  : "transparent",
            }}
            sx={{
              borderColor:
                meta.touched && meta.error
                  ? colorMode === "light"
                    ? `red.500`
                    : `redDim.500`
                  : "transparent",
            }}
            _focusVisible={{
              borderColor:
                colorMode === "light"
                  ? `${colorPref}.500`
                  : `${colorPref}Dim.500`,
              background: colorMode == "light" ? "white" : "#222222",
            }}
          />
        </Box>
      </FormControl>
    </>
  );
};

export const InputField = ({ ...props }: InputPropsNew) => {
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);

  return (
    <>
      <FormControl>
        <Box
          className="wizard__input_container"
          pos="relative"
          flexGrow="1"
          mb="16px"
        >
          <FormLabel
            fontSize="14px"
            fontWeight="500"
            mb="0px"
            pl="2px"
            display="flex"
            justifyContent="space-between"
            alignItems="end"
          />

          <Input
            {...props}
            // value={value}
            // onChange={onChange}
            isDisabled={props.isDisabled}
            className="sorting__input"
            w="100%"
            h="56px"
            p="0px 20px 0 20px"
            borderWidth="2px"
            borderStyle="solid"
            borderRadius="16px"
            bg={colorMode == "light" ? "rgba(228,228,228,0.3)" : "#292929"}
            fontSize="14px"
            fontWeight="600"
            color={colorMode == "light" ? "#1b1d21" : "#fff"}
            _placeholder={{
              color: "#bababa",
              fontWeight: "500",
            }}
            placeholder={props.placeholder}
          />
        </Box>
      </FormControl>
    </>
  );
};

export default InputFormik;

import { Box, Button, Flex, Input, Text, useColorMode } from "@chakra-ui/react";
import { useContext, useState } from "react";
import { Wizard, useWizard } from "react-use-wizard";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Textarea,
} from "@chakra-ui/react";
import {
  Field,
  FieldAttributes,
  FieldHookConfig,
  Form,
  Formik,
  useField,
} from "formik";
import AppSettingContext from "@/providers/AppSettingProvider";

type InputProps = {
  label: string;
  name: string;
  validate?: (value: any) => undefined | string | Promise<any>;
  type?: string;
  multiple?: boolean;
  value?: string;
  req?: boolean;
  helpertext?: string;
  placeholder?: string;
  isDisabled?: boolean;
};
const InputArea = ({ ...props }: InputProps) => {
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
            // mb="7px"
            pl="2px"
            display="flex"
            justifyContent="space-between"
          >
            <Box>
              {props.label}{" "}
              <Box
                display={props.req ? "unset" : "none"}
                color={colorMode === "light" ? "red.500" : "redDim.500"}
              >
                *
              </Box>
            </Box>
          </FormLabel>
          <Text
            pl="2px"
            color="#808080"
            fontSize="13px"
            display="block"
            mb="6px"
            mt="1px"
          >
            {props.helpertext}
          </Text>

          <Textarea
            {...field}
            // {...props}
            isDisabled={props.isDisabled}
            className="sorting__input"
            w="100%"
            h="112px"
            p="20px"
            resize="none"
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
          <Text
            display={meta.touched && meta.error ? "block" : "none"}
            color="#ff3333"
            fontWeight="500"
          >
            {"\u00A0"}
            {meta.error}
          </Text>
        </Box>
      </FormControl>
    </>
  );
};

export default InputArea;

export const InputAreaNoLabel = ({ ...props }: InputProps) => {
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
          {/* <FormLabel
            fontSize="14px"
            fontWeight="500"
            // mb="7px"
            pl="2px"
            display="flex"
            justifyContent="space-between"
          >
            <Flex>
              {props.label}{" "}
              <Text display={props.req ? "unset" : "none"} color="#ff3333">
                {"\u00A0"}*
              </Text>
            </Flex>

            <Text
              display={meta.touched && meta.error ? "block" : "none"}
              color="#ff3333"
              fontWeight="500"
            >
              {"\u00A0"}
              {meta.error}
            </Text>
          </FormLabel> */}
          {/* <Text
            pl="2px"
            color="#808080"
            fontSize="13px"
            display="block"
            mb="6px"
            mt="1px"
          >
            {props.helpertext}
          </Text> */}

          <Textarea
            {...field}
            // {...props}

            className="sorting__input"
            w="100%"
            h="112px"
            p="20px"
            resize="none"
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

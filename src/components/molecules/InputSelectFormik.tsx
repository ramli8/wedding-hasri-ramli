import React from "react";
import {
  Box,
  Text,
  useColorMode,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { useField } from "formik";
import DropdownSelect from "./Select";

interface InputSelectProps {
  label?: string;
  name: string;
  validate?: (value: any) => undefined | string | Promise<any>;
  type?: string;
  multiple?: boolean;
  req?: boolean;
  helpertext?: string;
  placeholder?: string;
  onBlur?: () => void;
  onChange?: <T>(value: T) => void;
  options: any[];
  isRequired?: boolean;
  isClearable?: boolean;
  isDisabled?: boolean;
  defaultValue?: any;
  menuPosition?: "fixed" | "absolute";
  autoSetValue?: boolean;
  value?: any;
}

const InputSelectFormik = ({ ...selectProps }: InputSelectProps) => {
  const [field, meta, helpers] = useField(selectProps);
  const { colorMode } = useColorMode();

  const {
    defaultValue,
    label,
    name,
    req,
    helpertext,
    onBlur,
    onChange,
    options,
    isRequired,
    isClearable,
    isDisabled,
    placeholder,
    menuPosition = "fixed",
    autoSetValue = true,
    value,
  } = selectProps;

  const onChangeFn = (option: any) => {
    onChange ? onChange(option) : null;
    autoSetValue && helpers.setValue(option);
  };

  return (
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
          mb="2px"
          pl="2px"
          display="flex"
          justifyContent="space-between"
          alignItems="end"
        >
          <Box>
            <Box>
              {label}{" "}
              <Box
                display={req ? "unset" : "none"}
                color={colorMode === "light" ? "red.500" : "redDim.500"}
              >
                *
              </Box>
            </Box>
            <Text
              color="#808080"
              fontSize="13px"
              display="block"
              mb="6px"
              mt="1px"
            >
              {helpertext}
            </Text>
          </Box>
        </FormLabel>

        <DropdownSelect
          placeholder={placeholder}
          defaultValue={
            options
              ? options.find((option) => option.value === field.value)
              : ""
          }
          isInvalid={meta.touched && meta.error ? true : false}
          isRequired={isRequired}
          isClearable={isClearable}
          isDisabled={isDisabled}
          options={options}
          name={name}
          value={autoSetValue ? field.value : value}
          onChange={onChangeFn}
          menuPosition={menuPosition}
          onBlur={() => {
            helpers.setTouched(true);
            if (onBlur) onBlur();
          }}
        />
        <Text
          display={meta.touched && meta.error ? "block" : "none"}
          color={colorMode === "light" ? "red.500" : "redDim.500"}
          fontWeight="500"
          pt="6px"
          pb="0"
          fontSize="14px"
        >
          {"\u00A0"}
          {meta.error}
        </Text>
      </Box>
    </FormControl>
  );
};

export default InputSelectFormik;

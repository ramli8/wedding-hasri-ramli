// Select.tsx
import React, { useContext, useEffect, useRef, useState } from "react";
import Select, {
  ActionMeta,
  CSSObjectWithLabel,
  StylesConfig,
  components,
} from "react-select";
import { Box, Text, useColorMode, useTheme } from "@chakra-ui/react";
import AppSettingContext from "@/providers/AppSettingProvider";

interface SelectProps {
  defaultValue?: any;
  options: any[];
  isDisabled?: boolean;
  isLoading?: boolean;
  isClearable?: boolean;
  isRtl?: boolean;
  isSearchable?: boolean;
  isMulti?: boolean;
  isInvalid?: boolean;
  name?: string;
  placeholder?: string;
  value?: any;
  onChange?: ((newValue: any, actionMeta: ActionMeta<any>) => void) | undefined;
  onBlur?: () => void;
  isRequired?: boolean;
  inputValue?: string;
  onInputChange?: (inputValue: string) => void;
  menuPosition?: "fixed" | "absolute";
}

const DropdownSelect: React.FC<SelectProps> = ({
  defaultValue,
  options,
  isDisabled,
  isLoading,
  isClearable,
  isRtl,
  isSearchable,
  isMulti,
  isInvalid,
  name,
  placeholder,
  onChange,
  onBlur,
  value,
  isRequired,
  inputValue,
  onInputChange,
  menuPosition = "fixed",
}) => {
  const CustomNoOptionsMessage = (props: any) => {
    return (
      <components.NoOptionsMessage {...props}>
        <Text fontSize="14px">Tidak ada data</Text>
      </components.NoOptionsMessage>
    );
  };
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  const theme = useTheme();
  const customStyles: StylesConfig = {
    control: (base, state): CSSObjectWithLabel => {
      return {
        ...base,
        transition: "0.25s all",
        borderRadius: "16px",
        minHeight: "56px",
        padding: "2px 8px 2px 20px",
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: state.isFocused
          ? colorMode === "light"
            ? theme.colors[`${colorPref}`][500]
            : theme.colors[`${colorPref}Dim`][500]
          : isInvalid
          ? colorMode === "light"
            ? theme.colors[`red`][500]
            : theme.colors[`redDim`][500]
          : "transparent",
        boxShadow: "none",
        background: colorMode === "light" ? "rgba(228,228,228,0.3)" : "#292929",
        color: colorMode === "light" ? "#222222" : "#ffffff",
        cursor: "pointer",
        "&:hover": {
          borderColor: state.isFocused
            ? colorMode === "light"
              ? theme.colors[`${colorPref}`][500]
              : theme.colors[`${colorPref}Dim`][500]
            : isInvalid
            ? colorMode === "light"
              ? theme.colors[`red`][500]
              : theme.colors[`redDim`][500]
            : "transparent",
        },
      };
    },

    placeholder: (base, state): CSSObjectWithLabel => {
      return {
        ...base,
        transition: "0.25s all",
        fontSize: "14px",
        fontWeight: 600,
        color: state.isFocused
          ? colorMode === "light"
            ? "#000000"
            : "#ffffff"
          : state.isDisabled
          ? colorMode === "light"
            ? "#c2c2c2"
            : "#5c5c5c"
          : "#808080",
      };
    },

    input: (base): CSSObjectWithLabel => {
      return {
        ...base,
        fontSize: "14px",
        fontWeight: 500,
        color: colorMode === "light" ? "#000000" : "#ffffff",
      };
    },

    valueContainer: (base): CSSObjectWithLabel => {
      return {
        ...base,
        padding: "0px",
      };
    },

    singleValue: (base, state): CSSObjectWithLabel => {
      return {
        ...base,
        fontSize: "14px",
        fontWeight: 600,
        color: state.isDisabled
          ? colorMode === "light"
            ? "#919191"
            : "#8a8a8a"
          : colorMode === "light"
          ? "#000000"
          : "#ffffff",
      };
    },

    multiValue: (base, state): CSSObjectWithLabel => {
      return {
        ...base,
        borderRadius: "16px",
        padding: "2px 6px",
        margin: "4px 6px 4px 0px",
        background: state.isDisabled
          ? colorMode === "light"
            ? "#ebebeb"
            : "#383838"
          : colorMode === "light"
          ? "#e5e5e5"
          : "#3b3b3b",
      };
    },

    multiValueLabel: (base, state): CSSObjectWithLabel => {
      return {
        ...base,
        fontSize: "14px",
        fontWeight: 600,
        color: state.isDisabled
          ? colorMode === "light"
            ? "#919191"
            : "#8a8a8a"
          : colorMode === "light"
          ? "#000000"
          : "#ffffff",
      };
    },

    multiValueRemove: (base, state): CSSObjectWithLabel => {
      return {
        ...base,
        color: "transparent",
        backgroundImage: `url(/closemini.svg)`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        filter: state.isDisabled
          ? "invert(0.5)"
          : colorMode === "light"
          ? "none"
          : "invert(1)",
        "&:hover": {
          background: "transparent",
          color: "black",
          filter: colorMode === "light" ? "none" : "invert(1)",
        },
      };
    },
    clearIndicator: (base, state): CSSObjectWithLabel => {
      return {
        ...base,
        color: "transparent",
        backgroundImage: `url(/close.svg)`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        // filter: colorMode === "light" ? "none" : "invert(1)",
        filter: state.isFocused
          ? colorMode === "light"
            ? "none"
            : "invert(1)"
          : colorMode === "light"
          ? "invert(0.5)"
          : "invert(0.5)",
        "&:hover": {
          color: "transparent",
        },
      };
    },

    indicatorSeparator: (base): CSSObjectWithLabel => {
      return {
        ...base,
        background: "transparent",
      };
    },

    dropdownIndicator: (base, state): CSSObjectWithLabel => {
      return {
        ...base,
        transition: "0.25s all",
        color: "transparent",
        backgroundImage: `url(/arrowdown.svg)`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        filter: state.isDisabled
          ? colorMode === "light"
            ? "invert(0.7)"
            : "invert(0.3)"
          : colorMode === "light"
          ? "none"
          : "invert(1)",
        transform: state.isFocused ? "rotate(180deg)" : "rotate(0)",
      };
    },

    menu: (base): CSSObjectWithLabel => {
      return {
        ...base,
        borderRadius: "24px",
        padding: "14px 16px",
        boxShadow:
          colorMode === "light"
            ? "0 4px 16px rgba(227, 230, 236, 0.4)"
            : "0 4px 24px rgba(0, 0, 0, 0.15)",
        outline:
          colorMode === "light" ? "1px solid #e4e4e4" : "1px solid #333333",
        background: colorMode === "light" ? "#ffffff" : "#222222",
      };
    },

    menuList: (base): CSSObjectWithLabel => {
      return {
        ...base,
        maxHeight: "300px",
        "::-webkit-scrollbar-thumb": {
          backgroundColor: colorMode == "light" ? "#dadada" : "#313131",
          outline: "5px solid transparent",
        },
        "::-webkit-scrollbar-thumb:hover": {
          backgroundColor: colorMode == "light" ? "#b3b3b3" : "#393939",
        },
        scrollBehavior: "smooth",
      };
    },

    option: (base, state): CSSObjectWithLabel => {
      return {
        ...base,
        transition: "0.25s all",
        cursor: "pointer",
        borderRadius: "16px",
        background: state.isSelected
          ? colorMode === "light"
            ? "#e8e8e8"
            : "#3b3b3b"
          : "transparent",
        padding: "16px",
        color: state.isSelected
          ? colorMode === "light"
            ? "black"
            : "white"
          : colorMode === "light"
          ? "black"
          : "white",
        fontSize: "14px",
        fontWeight: 600,
        "&:hover": {
          background: state.isSelected
            ? colorMode === "light"
              ? "#e8e8e8"
              : "#3b3b3b"
            : colorMode === "light"
            ? "#f7f7f7"
            : "#2f2f2f",
        },
      };
    },
  };
  const selectRef = useRef<any>(null);
  const [hiddenInputValue, setHiddenInputValue] = useState<string | undefined>(
    value
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setHiddenInputValue(inputValue);
    selectRef.current.select.onInputChange(inputValue, {
      action: "input-change",
    });
  };

  useEffect(() => {
    setHiddenInputValue(value);
  }, [value]);
  return (
    <div>
      <Select
        defaultValue={defaultValue}
        options={options}
        isDisabled={isDisabled}
        isLoading={isLoading}
        isClearable={isClearable}
        isRtl={isRtl}
        isSearchable={isSearchable}
        isMulti={isMulti}
        name={name}
        placeholder={placeholder}
        styles={customStyles}
        components={{ NoOptionsMessage: CustomNoOptionsMessage }}
        onChange={onChange}
        value={value}
        menuPlacement="auto"
        menuPosition={menuPosition}
        ref={selectRef}
        onBlur={() => {
          if (onBlur) onBlur();
        }}
        inputValue={inputValue}
        onInputChange={onInputChange}
      />
      {isRequired && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{
            opacity: 0,
            width: "100%",
            height: 0,
            position: "absolute",
          }}
          value={hiddenInputValue || ""}
          onChange={handleInputChange}
          onFocus={() => selectRef.current.focus()}
          required
        />
      )}
    </div>
  );
};

export default DropdownSelect;

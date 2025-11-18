import {
  Box,
  BoxProps,
  Center,
  Checkbox,
  createIcon,
  Stack,
  StackProps,
  Text,
  useCheckbox,
  useCheckboxGroup,
  UseCheckboxGroupProps,
  UseCheckboxProps,
  useColorModeValue,
  useId,
  useStyleConfig,
} from "@chakra-ui/react";
import {
  Children,
  cloneElement,
  isValidElement,
  ReactElement,
  useContext,
  useMemo,
} from "react";
import { CheckmarkSolidIconMade } from "../atoms/IconsMade";
import AppSettingContext from "@/providers/AppSettingProvider";

type CheckboxCardGroupProps = StackProps & UseCheckboxGroupProps;

export const CheckboxCardGroup = (props: CheckboxCardGroupProps) => {
  const { children, defaultValue, value, onChange, ...rest } = props;
  const { getCheckboxProps } = useCheckboxGroup({
    defaultValue,
    value,
    onChange,
  });

  const cards = useMemo(
    () =>
      Children.toArray(children)
        .filter<ReactElement<CheckboxCardProps>>(isValidElement)
        .map((card) => {
          return cloneElement(card, {
            checkboxProps: getCheckboxProps({
              value: card.props.value,
            }),
          });
        }),
    [children, getCheckboxProps]
  );

  return <Stack {...rest}>{cards}</Stack>;
};

interface CheckboxCardProps extends BoxProps {
  value: string;
  hasMark?: boolean;
  defaultChecked?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  name?: string;
  checkboxProps?: UseCheckboxProps;
  hasBackground?: boolean;
  alignMark?: "start" | "center" | "end";
}

export const CheckboxCard = (props: CheckboxCardProps) => {
  const {
    checkboxProps,
    children,
    hasMark = true,
    defaultChecked,
    isDisabled,
    isRequired,
    isInvalid,
    name,
    alignMark = "center",
    hasBackground,
    ...rest
  } = props;
  const { getInputProps, getCheckboxProps, getLabelProps, state } = useCheckbox(
    { ...checkboxProps, defaultChecked }
  );
  const id = useId(undefined, "checkbox-card");
  const { colorPref } = useContext(AppSettingContext);
  const styles = useStyleConfig("RadioCard", props);
  const borderdefault = useColorModeValue("gray.100", "gray.700");
  const borderactive = useColorModeValue(
    `${colorPref}.500`,
    `${colorPref}Dim.500`
  );
  const backgroundactive = useColorModeValue(
    `${colorPref}.50`,
    `${colorPref}Dim.800`
  );
  const disabledborderdefault = useColorModeValue("gray.100", "gray.800");
  const disabledbordermark = useColorModeValue("gray.200", "gray.800");
  const disabledbackground = useColorModeValue(
    "blackAlpha.50",
    "whiteAlpha.100"
  );
  const disabledcheckmarkactive = useColorModeValue("white", "gray.400");
  const disabledtext = useColorModeValue("gray.400", "gray.700");
  const errorcolor = useColorModeValue("red.500", "#B53F3F");

  return (
    <Box
      as="label"
      {...getLabelProps()}
      sx={{
        ".focus-visible + [data-focus]": {
          boxShadow: "outline",
          zIndex: 1,
        },
      }}
      _notFirst={{ marginInlineStart: "0px", marginTop: "0px" }}
      w="auto"
    >
      <input
        {...getInputProps()}
        aria-labelledby={id}
        width="auto"
        disabled={isDisabled}
        required={isRequired}
        name={name}
        style={{ position: "relative", display: "none" }}
      />

      {isDisabled ? (
        <Box
          sx={styles}
          {...getCheckboxProps()}
          {...rest}
          cursor="not-allowed"
          bg={state.isChecked ? backgroundactive : disabledbackground}
          border="2px solid"
          borderColor={state.isChecked ? borderactive : borderdefault}
          borderRadius="16px"
          p="16px"
          transition="all .25s"
          display="flex"
          justifyContent="space-between"
          alignItems={alignMark}
          gap={3}
          opacity=".5"
        >
          {hasMark && (
            <Box w="20px" h="20px">
              <Center
                w="20px"
                h="20px"
                bg={state.isChecked ? borderactive : borderdefault}
                border="2px solid"
                borderColor={state.isChecked ? borderactive : borderdefault}
                borderRadius="8px"
                transition="all .25s"
              >
                <CheckmarkSolidIconMade
                  fontSize="12px"
                  color={state.isChecked ? "white" : "transparent"}
                />
              </Center>
            </Box>
          )}
          <Box flex="1">{children}</Box>
        </Box>
      ) : (
        <Box
          sx={styles}
          {...getCheckboxProps()}
          {...rest}
          cursor="pointer"
          bg={
            hasBackground && hasBackground && state.isChecked
              ? backgroundactive
              : "unset"
          }
          border="2px solid"
          borderColor={
            state.isChecked
              ? borderactive
              : isInvalid
              ? errorcolor
              : borderdefault
          }
          borderRadius="16px"
          p="16px"
          transition="all .25s"
          display="flex"
          alignItems={alignMark}
          gap={3}
        >
          {hasMark && (
            <Box w="20px" h="20px">
              <Center
                w="20px"
                h="20px"
                bg={state.isChecked ? borderactive : "unset"}
                border="2px solid"
                borderColor={
                  state.isChecked
                    ? borderactive
                    : isInvalid
                    ? errorcolor
                    : borderdefault
                }
                borderRadius="8px"
                transition="all .25s"
              >
                <CheckmarkSolidIconMade
                  fontSize="12px"
                  color={state.isChecked ? "white" : "transparent"}
                />
              </Center>
            </Box>
          )}
          <Box flex="1">{children}</Box>
        </Box>
      )}
    </Box>
  );
};

export const CheckboxCardReverse = (props: CheckboxCardProps) => {
  const {
    checkboxProps,
    children,
    hasMark = true,
    defaultChecked,
    isDisabled,
    isRequired,
    isInvalid,
    name,
    alignMark = "center",
    hasBackground,
    ...rest
  } = props;
  const { getInputProps, getCheckboxProps, getLabelProps, state } = useCheckbox(
    { ...checkboxProps, defaultChecked }
  );
  const id = useId(undefined, "checkbox-card");
  const { colorPref } = useContext(AppSettingContext);
  const styles = useStyleConfig("RadioCard", props);
  const borderdefault = useColorModeValue("gray.100", "gray.800");
  const borderactive = useColorModeValue(
    `${colorPref}.500`,
    `${colorPref}Dim.500`
  );
  const backgroundactive = useColorModeValue(
    `${colorPref}.50`,
    `${colorPref}Dim.800`
  );
  const disabledborderdefault = useColorModeValue("gray.100", "gray.800");
  const disabledbordermark = useColorModeValue("gray.200", "gray.800");
  const disabledbackground = useColorModeValue(
    "blackAlpha.50",
    "whiteAlpha.100"
  );
  const disabledcheckmarkactive = useColorModeValue("white", "gray.400");
  const disabledtext = useColorModeValue("gray.400", "gray.700");
  const errorcolor = useColorModeValue("red.500", "#B53F3F");

  return (
    <Box
      as="label"
      {...getLabelProps()}
      sx={{
        ".focus-visible + [data-focus]": {
          boxShadow: "outline",
          zIndex: 1,
        },
      }}
      _first={{ marginInlineStart: "0px", marginTop: "0px" }}
      _notFirst={{ marginInlineStart: "0px", marginTop: "0px" }}
      w="auto"
    >
      <input
        {...getInputProps()}
        aria-labelledby={id}
        width="auto"
        disabled={isDisabled}
        required={isRequired}
        name={name}
        style={{ position: "relative", display: "none" }}
      />

      {isDisabled ? (
        <Box
          sx={styles}
          {...getCheckboxProps()}
          {...rest}
          cursor="not-allowed"
          bg={state.isChecked ? backgroundactive : disabledbackground}
          border="2px solid"
          borderColor={state.isChecked ? borderactive : borderdefault}
          borderRadius="16px"
          p="16px"
          transition="all .25s"
          display="flex"
          justifyContent="space-between"
          alignItems={alignMark}
          gap={3}
          opacity=".5"
        >
          <Box flex="1">{children}</Box>
          {hasMark && (
            <Box w="20px" h="20px">
              <Center
                w="20px"
                h="20px"
                bg={state.isChecked ? borderactive : borderdefault}
                border="2px solid"
                borderColor={state.isChecked ? borderactive : borderdefault}
                borderRadius="8px"
                transition="all .25s"
              >
                <CheckmarkSolidIconMade
                  fontSize="12px"
                  color={state.isChecked ? "white" : "transparent"}
                />
              </Center>
            </Box>
          )}
        </Box>
      ) : (
        <Box
          sx={styles}
          {...getCheckboxProps()}
          {...rest}
          cursor="pointer"
          bg={hasBackground && state.isChecked ? backgroundactive : "unset"}
          border="2px solid"
          borderColor={
            state.isChecked
              ? borderactive
              : isInvalid
              ? errorcolor
              : borderdefault
          }
          borderRadius="16px"
          p="16px"
          transition="all .25s"
          display="flex"
          justifyContent="space-between"
          alignItems={alignMark}
          gap={3}
        >
          <Box flex="1">{children}</Box>
          {hasMark && (
            <Box w="20px" h="20px">
              <Center
                w="20px"
                h="20px"
                bg={state.isChecked ? borderactive : "unset"}
                border="2px solid"
                borderColor={
                  state.isChecked
                    ? borderactive
                    : isInvalid
                    ? errorcolor
                    : borderdefault
                }
                borderRadius="8px"
                transition="all .25s"
              >
                <CheckmarkSolidIconMade
                  fontSize="12px"
                  color={state.isChecked ? "white" : "transparent"}
                />
              </Center>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

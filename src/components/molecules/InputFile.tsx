import { CloseIcon } from "@/components/atoms/IconParams";
import { Box, Flex, FormControl, FormLabel, Text, Tooltip, useColorMode } from "@chakra-ui/react";
import { useField, useFormikContext } from "formik";
import { useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { FileUploader } from "react-drag-drop-files";

// const fileTypes = ["JPEG", "PNG", "JPG"];

type InputProps = {
  label: string;
  name: string;
  validate?: (value: any) => undefined | string | Promise<any>;
  type?: string;
  multiple?: boolean;
  req?: boolean;
  helpertext?: string;
  placeholder?: string;
  display?: string;
  maxSize?: number;
  fileTypes: string[];
};

const InputFileFormik = ({ ...props }: InputProps) => {
  type StatusFile = "error" | "selected" | "dropped" | "";

  const [fileUpload, setFileUpload] = useState<any>([]);
  const [objUrl, setObjectUrl] = useState<any[]>([]);
  const { setFieldValue } = useFormikContext();
  const [field, meta, helpers] = useField(props);
  const [statusFile, setStatus] = useState<StatusFile>("");
  const { colorMode } = useColorMode();
  const [dragged, setDragged] = useState<boolean | undefined>();

  const handleChange = (fileInput: FileList) => {
    const addedFiles: File[] = fileUpload
    const files: File[] = Array.from(fileInput);

    files?.map((item: File) => {
      addedFiles.push(item)
    })

    let filesObjectUrl: any[] = [];

    addedFiles?.map((item: File, index: number) => {
      const reader = new FileReader();
      reader.readAsDataURL(item);
      reader.onloadend = (readerEvent: ProgressEvent<FileReader>) => {
        if (readerEvent?.target?.result) {
          setFieldValue(props.name, readerEvent.target.result);
          filesObjectUrl.push(URL.createObjectURL(item));
        }
      };
    });

    setFileUpload(addedFiles);
    setObjectUrl(filesObjectUrl);
  };

  const handleDelete = (index: number) => {
    const newFile = [...fileUpload];
    const newObjUrl = [...objUrl];

    newFile.splice(index, 1);
    newObjUrl.splice(index, 1);

    setFieldValue(props.name, newFile)
    setFileUpload(newFile);
    setObjectUrl(newObjUrl);
  };

  return (
    <>
      <FormControl>
        <Box
          className="wizard__input_container"
          pos="relative"
          flexGrow="1"
          transition="all .25s"
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
              <Flex>
                {props.label}{" "}
                <Text
                  display={props.req ? "unset" : "none"}
                  color={colorMode === "light" ? "red.500" : "redDim.500"}
                >
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
            </Box>

            <Text
              display={
                (meta.error) || statusFile == "error"
                  ? "block"
                  : "none"
              }
              color={colorMode === "light" ? "red.500" : "redDim.500"}
              fontWeight="500"
              pb="6px"
              fontSize="14px"
            >
              {"\u00A0"}
              {meta.error}
            </Text>
          </FormLabel>
        </Box>
        <FileUploader
          {...field}
          {...props}
          multiple={true}
          handleChange={handleChange}
          onDraggingStateChange={() => {
            dragged ? setDragged(false) : setDragged(true);
          }}
          name="file"
          types={props.fileTypes}
          zIndex="0"
          position="relative"
          onSizeError={() => {
            setStatus("error");
          }}
          onSelect={() => {
            setStatus("selected");
          }}
          onDrop={() => {
            setStatus("dropped");
          }}
        >
          <Flex
            // mt="6px"
            mb="12px"
            display={props.display}
            flexDir="column"
            bg={colorMode == "light" ? "white" : "#222222"}
            zIndex="0"
            position="relative"
          >
            <Box
              className="file__uploader"
              display="flex"
              pos="relative"
              w="100%"
              maxH="200px"
              h="120px"
              bg={
                colorMode == "light"
                  ? dragged
                    ? "#f7f7f7"
                    : "#008ffa10"
                  : "#292929"
              }
              borderRadius="16px"
              justifyContent="center"
              alignItems="center"
              cursor="pointer"
              outline="2px solid"
              outlineColor="transparent"
              sx={{
                scrollbarGutter: "stable both-edges",
                "::-webkit-scrollbar-thumb": {
                  backgroundColor: colorMode == "light" ? "#dadada" : "#292929",
                },
                outlineColor:
                  meta.error
                    ? colorMode === "light"
                      ? `red.500`
                      : `redDim.500`
                    : "transparent",
              }}
              _hover={{
                backgroundColor: colorMode == "light" ? "#fff" : "#141414",
                outlineColor:
                  colorMode == "light"
                    ? `blue.500`
                    : `blueDim.500`,
              }}
              transition="all 0.25s"
            >
              <Box
                w="100%"
                h="100%"
                pos="relative"
                // bgImage="/images/borderdashed.png"
                bgSize="contain"
                bgPosition="center"
                bgRepeat="no-repeat"
                borderRadius="16px"
                filter={
                  !dragged
                    ? "grayscale(0)"
                    : (meta.error) || statusFile == "error"
                      ? statusFile == "selected" || statusFile == "dropped"
                        ? "grayscale(1)"
                        : "grayscale(0) hue-rotate(140deg)"
                      : "grayscale(1)"
                }
                opacity={
                  !dragged
                    ? "1"
                    : (meta.error) || statusFile == "error"
                      ? statusFile == "selected" || statusFile == "dropped"
                        ? "0.45"
                        : "1"
                      : "0.45"
                }
                transition="all 0.18s"
                _groupHover={{
                  filter: "grayscale(0)",
                  opacity: "1",
                }}
              ></Box>
              <Box
                display="flex"
                flexDir="column"
                justifyContent="center"
                alignItems="center"
                pos="absolute"
              >
                <Flex>
                  <Text
                    fontSize="14px"
                    fontWeight="500"
                    color="#808080"
                    textDecor="underline"
                    _groupHover={{
                      color: `blue.500`,
                    }}
                    transition="all .25s"
                  >
                    Klik untuk upload
                  </Text>
                  <Text
                    fontSize="14px"
                    fontWeight="500"
                    color="#808080"
                    transition="all .25s"
                  >
                    &nbsp;atau
                  </Text>
                  <Text
                    fontSize="14px"
                    fontWeight="500"
                    transition="all .25s"
                    color={
                      !dragged
                        ? `blue.500`
                        : meta.error
                          ? statusFile == "selected" || statusFile == "dropped"
                            ? "#808080"
                            : "#808080"
                          : "#808080"
                    }
                  >
                    &nbsp;seret & lepas file disini
                  </Text>
                </Flex>

                <Flex>
                  <Text
                    pt="8px"
                    fontSize="13px"
                    fontWeight="500"
                    color="#808080"
                    transition="all .25s"
                  >
                    PNG/JPG maks. 2 MB
                  </Text>
                </Flex>
              </Box>
            </Box>
          </Flex>
        </FileUploader>
      </FormControl>
      {fileUpload?.map((item: File, index: number) => (
        <Box
          display={item.name !== undefined ? "flex" : "none"}
          w="100%"
          h="100%"
          borderRadius="16px"
          bg={colorMode == "light" ? "#f7f7f7" : "#292929"}
          p="16px"
          mb="24px"
          transition="all .25s"
          key={"file_input_" + index}
          mt="24px"
        >
          <Box
            w="40px"
            minW="40px"
            display="flex"
            justifyContent="center"
            alignItems="center"
            h="40px"
            bg={colorMode == "light" ? "#fff" : "#333333"}
            borderRadius="9px"
            boxShadow="0px 0px 10px 0px rgba(0,0,0,0.02)"
          >
            <Text fontWeight="600" fontSize="12px">
              IMG
            </Text>
          </Box>
          <Flex w="100%" h="100%" pl="12px" flexDir="column" pos="relative">
            <Text fontSize="14px" fontWeight="500">
              {item.name}
            </Text>
            <Text fontSize="13px" fontWeight="400" color="#808080">
              {item.size !== undefined
                ? (item.size / 1024 / 1024).toFixed(2) + " MB"
                : ""}
            </Text>
            <Flex
              pos="absolute"
              h="100%"
              right="0"
              justifyContent="center"
              alignItems="center"
              gap="8px"
            >
              <Tooltip
                hasArrow
                label="Lihat file"
                fontWeight="400"
                fontSize="12px"
                color="#141414"
                bg="white"
                borderRadius="8px"
              >
                <Box
                  w="26px"
                  h="26px"
                  bg="#1b1b1b"
                  color="white"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  fontSize="12px"
                  borderRadius="50%"
                  cursor="pointer"
                  _hover={{
                    backgroundColor: `blue.500`,
                  }}
                  transition="all .2s"
                  onClick={(e) => {
                    e.stopPropagation();
                    const imgsrc =
                      "<html><head><title>" +
                      item.name +
                      '</title></head><body style="overflow-y: auto; overflow-x: hidden;"><div style="display: flex; justify-content: center; align-items: center; width: 100vw; height: auto;"><img src="' +
                      objUrl[index] +
                      '" width: "100%" height: "auto" style="max-width: 100%;"></flex></body></html>';
                    window.open("_blank")?.document.write(imgsrc);
                  }}
                >
                  <Box
                    bgImage="/images/icon/eye.png"
                    w="16px"
                    h="16px"
                    bgPos="center"
                    bgSize="contain"
                    filter="invert(100%)"
                  ></Box>
                </Box>
              </Tooltip>

              <Tooltip
                hasArrow
                label="Hapus file"
                fontWeight="400"
                fontSize="12px"
                color="#141414"
                bg="white"
                borderRadius="8px"
              >
                <Box
                  w="26px"
                  h="26px"
                  bg="#1b1b1b"
                  color="white"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  fontSize="12px"
                  borderRadius="50%"
                  cursor="pointer"
                  _hover={{
                    backgroundColor:
                      colorMode === "light" ? "red.500" : "redDim.500",
                  }}
                  transition="all .2s"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(index);
                  }}
                >
                  <CloseIcon color="white" fontSize="10px"></CloseIcon>
                </Box>
              </Tooltip>
            </Flex>
          </Flex>
        </Box>
      ))}
    </>
  );
};

export default InputFileFormik;

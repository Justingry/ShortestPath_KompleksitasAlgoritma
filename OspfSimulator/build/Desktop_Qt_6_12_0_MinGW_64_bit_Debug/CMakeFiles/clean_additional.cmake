# Additional clean files
cmake_minimum_required(VERSION 3.16)

if("${CONFIG}" STREQUAL "" OR "${CONFIG}" STREQUAL "Debug")
  file(REMOVE_RECURSE
  "CMakeFiles\\OspfSimulator_autogen.dir\\AutogenUsed.txt"
  "CMakeFiles\\OspfSimulator_autogen.dir\\ParseCache.txt"
  "OspfSimulator_autogen"
  )
endif()

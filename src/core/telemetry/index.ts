export const telemetry = {
  track: (event: string, data: any) => {
    console.log('Telemetry:', event, data);
  },
};
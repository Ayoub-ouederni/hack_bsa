declare module 'snarkjs' {
  export namespace groth16 {
    function fullProve(
      input: Record<string, unknown>,
      wasmFile: string,
      zkeyFileName: string
    ): Promise<{ proof: Record<string, unknown>; publicSignals: string[] }>;

    function verify(
      verificationKey: Record<string, unknown>,
      publicSignals: string[],
      proof: Record<string, unknown>
    ): Promise<boolean>;
  }
}

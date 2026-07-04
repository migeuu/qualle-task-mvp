import { Public, IS_PUBLIC_KEY } from '../public.decorator';

describe('Public decorator', () => {
  it('should set IS_PUBLIC_KEY metadata to true on method', () => {
    class TestClass {
      @Public()
      testMethod() {}
    }

    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestClass.prototype.testMethod);
    expect(metadata).toBe(true);
  });

  it('should set IS_PUBLIC_KEY metadata to true on class', () => {
    @Public()
    class TestClass {}

    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestClass);
    expect(metadata).toBe(true);
  });

  it('should have a distinct IS_PUBLIC_KEY constant', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });

  it('should not set metadata on non-decorated methods', () => {
    class TestClass {
      @Public()
      decorated() {}

      notDecorated() {}
    }

    const decorated = Reflect.getMetadata(IS_PUBLIC_KEY, TestClass.prototype.decorated);
    const notDecorated = Reflect.getMetadata(IS_PUBLIC_KEY, TestClass.prototype.notDecorated);

    expect(decorated).toBe(true);
    expect(notDecorated).toBeUndefined();
  });
});

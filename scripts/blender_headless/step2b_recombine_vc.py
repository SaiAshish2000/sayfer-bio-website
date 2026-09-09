"""
The self-baked "basecolor_vc" DIFFUSE/COLOR pass has a bug: its blue channel
is stuck at exactly 0.0 across the whole mesh (verified by sampling), giving
an odd yellow-green cast once combined with AO. The AO bake itself is fine
(real 0..1 spread, min=0 median=0.53 max=1). Rather than debug Blender's
vertex-color DIFFUSE bake further, recombine using the approved flat warm
ochre base color (matching the pre-existing, already-approved flat tint)
multiplied by the working AO bake -- no re-bake needed, just a recombine.
"""
import bpy

WORK_PATH = r"D:\Projects\sayfer-bio\assets\blender\sayfer-scaffold-v2-bake-work.blend"
BASE_COLOR = (0.6, 0.375, 0.06)  # linear-space "deep golden ochre", ~#bf8b26 sRGB

bpy.ops.wm.open_mainfile(filepath=WORK_PATH)
lp = bpy.data.objects["Scaffold_LP"]

ao_attr = lp.data.color_attributes["ao_vc"]
final_attr = lp.data.color_attributes.get("final_vc")
if final_attr is None:
    final_attr = lp.data.color_attributes.new(name="final_vc", type="FLOAT_COLOR", domain="CORNER")

n = len(ao_attr.data)
r, g, b = BASE_COLOR
for i in range(n):
    ao = ao_attr.data[i].color[0]
    final_attr.data[i].color = (r * ao, g * ao, b * ao, 1.0)

lp.data.attributes.active_color = final_attr
lp.data.color_attributes.render_color_index = lp.data.color_attributes.find("final_vc")

bpy.ops.wm.save_as_mainfile(filepath=WORK_PATH)
print("SAVED", WORK_PATH)
print("DONE_RECOMBINE")
